// File: src/pages/competitive-analysis/AIResearchPage.js
// AI-powered web research — triggers backend to scrape property portals

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Collapse,
  Link,
  MenuItem,
  alpha,
  useTheme,
} from '@mui/material';
import {
  PsychologyAlt,
  Search,
  CheckCircle,
  Warning,
  ExpandMore,
  ExpandLess,
  OpenInNew,
  ArrowBack,
  AccessTime,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { competitiveAnalysisAPI } from '../../services/api';
import { PageHeader } from '../../components/common';
import { useAuth } from '../../context/AuthContext';

const PROJECT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed_use', label: 'Mixed Use' },
  { value: 'plotted_development', label: 'Plotted Development' },
];

const AIResearchPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const { canAccess } = useAuth();

  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [projectType, setProjectType] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [researching, setResearching] = useState(false);
  const [result, setResult] = useState(null);
  const [showSources, setShowSources] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const handleResearch = async () => {
    if (!city.trim() || !area.trim()) {
      enqueueSnackbar('City and Area are required', { variant: 'warning' });
      return;
    }

    try {
      setResearching(true);
      setResult(null);
      setElapsedMs(0);
      const payload = { city: city.trim(), area: area.trim() };
      if (projectType) payload.projectType = projectType;
      if (additionalContext.trim()) payload.additionalContext = additionalContext.trim();

      const poll = async () => {
        const res = await competitiveAnalysisAPI.triggerResearch(payload);

        if (res.data?.status === 'processing') {
          setElapsedMs(res.data.elapsedMs || 0);
          if (res.data.elapsedMs > 120000) {
            enqueueSnackbar('Research is taking longer than expected. Please try again.', { variant: 'error' });
            return;
          }
          await new Promise(r => setTimeout(r, 5000));
          return poll();
        }

        // status === 'completed' or legacy response
        setResult(res.data?.data || res.data);
        enqueueSnackbar(res.data?.message || 'Research completed', { variant: 'success' });
      };

      await poll();
    } catch (error) {
      const msg = error.response?.data?.message || 'AI Research failed';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setResearching(false);
      setElapsedMs(0);
    }
  };

  const handleReset = () => {
    setResult(null);
    setCity('');
    setArea('');
    setProjectType('');
    setAdditionalContext('');
  };

  return (
    <Box>
      <PageHeader
        title="AI Web Research"
        subtitle="Automatically research competitor data from property portals"
        badge="BETA"
        actions={
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/competitive-analysis')}>
            Back to Dashboard
          </Button>
        }
      />

      {/* Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        AI Research scans 99acres, MagicBricks, Housing.com, RERA portals, and developer websites to find and structure competitor data.
        This typically takes 10-30 seconds.
      </Alert>

      {/* Input Section */}
      {!result && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Research Parameters</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  size="small"
                  fullWidth
                  required
                  placeholder="e.g. Bangalore"
                  disabled={researching}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Area / Locality"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  size="small"
                  fullWidth
                  required
                  placeholder="e.g. Whitefield"
                  disabled={researching}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Project Type"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  size="small"
                  fullWidth
                  select
                  disabled={researching}
                >
                  {PROJECT_TYPES.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Additional Context (optional)"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="e.g. Focus on 2BHK and 3BHK projects near ITPL"
                  disabled={researching}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={researching ? null : <Search />}
                  onClick={handleResearch}
                  disabled={researching || !city.trim() || !area.trim()}
                >
                  {researching ? 'Researching...' : 'Start Research'}
                </Button>
              </Grid>
            </Grid>

            {/* Loading state */}
            {researching && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PsychologyAlt sx={{ color: 'primary.main', animation: 'pulse 1.5s infinite' }} />
                  <Typography variant="body2" color="text.secondary">
                    Analyzing {area}, {city}...{elapsedMs > 0 ? ` (${Math.round(elapsedMs / 1000)}s)` : ' This may take 30-60 seconds.'}
                  </Typography>
                </Box>
                <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Box>
          {/* Summary */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <CheckCircle color="success" />
                <Typography variant="subtitle1" fontWeight={600}>Research Complete</Typography>
                {result.status === 'partial' && (
                  <Chip label="Partial Results" size="small" color="warning" />
                )}
              </Box>

              {/* Summary pills */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`Found: ${result.projectsFound || 0} projects`}
                  sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontWeight: 600 }}
                />
                <Chip
                  label={`Created: ${result.projectsCreated || 0}`}
                  sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.main', fontWeight: 600 }}
                />
                <Chip
                  label={`Updated: ${result.projectsUpdated || 0}`}
                  sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.main', fontWeight: 600 }}
                />
              </Box>

              {/* Duration */}
              {result.durationMs && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    Completed in {(result.durationMs / 1000).toFixed(1)} seconds
                  </Typography>
                </Box>
              )}

              {/* Cost (admin only) */}
              {result.cost?.estimatedCost && canAccess.compAnalysisManageProviders() && (
                <Typography variant="caption" color="text.secondary">
                  Estimated cost: {result.cost.estimatedCost}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {result.warnings.map((warning, idx) => (
                <Alert key={idx} severity="warning" icon={<Warning />}>
                  {warning}
                </Alert>
              ))}
            </Box>
          )}

          {/* Projects found */}
          {result.projects?.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>Projects Found</Typography>
              <Grid container spacing={2}>
                {result.projects.map((proj, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={proj._id || idx}>
                    <Card
                      variant="outlined"
                      sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
                      onClick={() => proj._id && navigate(`/competitive-analysis/competitors/${proj._id}`)}
                    >
                      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>{proj.projectName}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {proj.developerName}
                        </Typography>
                        {proj.pricing?.pricePerSqft?.avg && (
                          <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ mt: 0.5 }}>
                            ₹{proj.pricing.pricePerSqft.avg.toLocaleString('en-IN')}/sqft
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                          <Chip
                            label={`Confidence: ${proj.confidenceScore || 0}%`}
                            size="small"
                            color={proj.confidenceScore >= 60 ? 'success' : 'warning'}
                            variant="outlined"
                            sx={{ fontSize: '0.65rem' }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Sources */}
          {result.sources?.length > 0 && (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => setShowSources(!showSources)}
                >
                  <Typography variant="subtitle2" fontWeight={600}>
                    Research Sources ({result.sources.length})
                  </Typography>
                  {showSources ? <ExpandLess /> : <ExpandMore />}
                </Box>
                <Collapse in={showSources}>
                  <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {result.sources.map((src, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <OpenInNew sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Link
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="caption"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {src.title || src.url}
                        </Link>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          )}

          {/* Post-research actions */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              onClick={() => navigate(`/competitive-analysis/competitors?city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}`)}
            >
              View All Competitors
            </Button>
            <Button variant="outlined" onClick={handleReset}>
              Research Another Locality
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AIResearchPage;

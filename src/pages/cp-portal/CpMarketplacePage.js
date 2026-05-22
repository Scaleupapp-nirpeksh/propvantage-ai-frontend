import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, CardActionArea, Grid, Avatar, Chip, Alert,
  CircularProgress, TextField, MenuItem, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider, InputAdornment, Pagination,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { marketplaceAPI, partnershipAPI, portfolioAPI } from '../../services/api';

const PROJECT_TYPE_OPTIONS = ['Residential', 'Commercial', 'Mixed Use', 'Plotted', 'Villa'];
const PROJECT_STATUS_OPTIONS = ['Pre-Launch', 'Launched', 'Under Construction', 'Ready to Move', 'Completed'];
const PAGE_LIMIT = 12;

const fmt = (n) => (n == null ? '—' : `₹${(Number(n) / 10000000).toFixed(2)} Cr`);

const STATUS_CHIP = {
  none: { label: 'Not connected', color: 'default' },
  pending: { label: 'Application pending', color: 'warning' },
  active: { label: 'Active partner', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
  suspended: { label: 'Suspended', color: 'warning' },
  terminated: { label: 'Terminated', color: 'default' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CHIP[status] || STATUS_CHIP.none;
  return <Chip size="small" label={cfg.label} color={cfg.color} />;
};

const CpMarketplacePage = () => {
  const [filters, setFilters] = useState({
    q: '', city: '', projectType: '', projectStatus: '', priceMin: '', priceMax: '',
  });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ developers: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail dialog state
  const [selected, setSelected] = useState(null); // developer card object
  const [portfolio, setPortfolio] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState('');

  // Apply dialog state
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applyOk, setApplyOk] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = { page, limit: PAGE_LIMIT };
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v != null) params[k] = v;
    });
    marketplaceAPI.browseDevelopers(params)
      .then((res) => {
        const d = res.data?.data || {};
        setData({ developers: d.developers || [], total: d.total || 0 });
      })
      .catch(() => setError('Could not load the developer marketplace.'))
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (k) => (e) => {
    setFilters((f) => ({ ...f, [k]: e.target.value }));
    setPage(1);
  };

  const openDetail = (dev) => {
    setSelected(dev);
    setPortfolio(null);
    setPortfolioError('');
    setPortfolioLoading(true);
    setApplyOk('');
    portfolioAPI.getPortfolio(dev.organizationId)
      .then((res) => setPortfolio(res.data?.data || null))
      .catch(() => setPortfolioError('Could not load this developer’s portfolio.'))
      .finally(() => setPortfolioLoading(false));
  };

  const closeDetail = () => {
    setSelected(null);
    setPortfolio(null);
  };

  const openApply = () => {
    setApplyMessage('');
    setApplyError('');
    setApplyOpen(true);
  };

  const submitApply = async () => {
    if (!selected) return;
    setApplying(true);
    setApplyError('');
    try {
      await partnershipAPI.create({
        counterpartyOrgId: selected.organizationId,
        message: applyMessage,
      });
      setApplyOpen(false);
      setApplyOk('Application sent. The developer will review your request.');
      // Update card + selected status locally.
      setData((d) => ({
        ...d,
        developers: d.developers.map((x) =>
          x.organizationId === selected.organizationId ? { ...x, partnershipStatus: 'pending' } : x),
      }));
      setSelected((s) => (s ? { ...s, partnershipStatus: 'pending' } : s));
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Could not send your application.');
    } finally {
      setApplying(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_LIMIT));

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Developer Marketplace</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Discover real-estate developers and apply to partner with them.
      </Typography>

      {/* Filters */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" label="Search developers" value={filters.q}
                onChange={setFilter('q')}
                InputProps={{ startAdornment: (
                  <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                ) }} />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth size="small" label="City" value={filters.city}
                onChange={setFilter('city')} />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth size="small" select label="Project type" value={filters.projectType}
                onChange={setFilter('projectType')}>
                <MenuItem value="">Any</MenuItem>
                {PROJECT_TYPE_OPTIONS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth size="small" select label="Project status" value={filters.projectStatus}
                onChange={setFilter('projectStatus')}>
                <MenuItem value="">Any</MenuItem>
                {PROJECT_STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3} md={1}>
              <TextField fullWidth size="small" type="number" label="Min ₹" value={filters.priceMin}
                onChange={setFilter('priceMin')} />
            </Grid>
            <Grid item xs={6} sm={3} md={1}>
              <TextField fullWidth size="small" type="number" label="Max ₹" value={filters.priceMax}
                onChange={setFilter('priceMax')} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {applyOk && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setApplyOk('')}>{applyOk}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : data.developers.length === 0 ? (
        <Alert severity="info">No developers match your search. Try adjusting the filters.</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {data.developers.map((dev) => (
              <Grid item xs={12} sm={6} md={4} key={dev.organizationId}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardActionArea onClick={() => openDetail(dev)} sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                        <Avatar src={dev.logoUrl || undefined} sx={{ width: 48, height: 48 }}>
                          {dev.name?.[0]}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                            {dev.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {dev.city || '—'}
                          </Typography>
                        </Box>
                      </Box>
                      {dev.about && (
                        <Typography variant="body2" color="text.secondary" sx={{
                          mb: 1, display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {dev.about}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {dev.publishedProjectCount ?? 0} published project
                        {dev.publishedProjectCount === 1 ? '' : 's'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                        {(dev.projectTypes || []).slice(0, 4).map((t) => (
                          <Chip key={t} size="small" variant="outlined" label={t} />
                        ))}
                      </Box>
                      <Box sx={{ mt: 1.5 }}>
                        <StatusBadge status={dev.partnershipStatus} />
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} />
            </Box>
          )}
        </>
      )}

      {/* Developer detail dialog */}
      <Dialog open={!!selected} onClose={closeDetail} maxWidth="md" fullWidth>
        {selected && (
          <>
            <DialogTitle>{selected.name}</DialogTitle>
            <DialogContent dividers>
              {portfolioLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
              ) : portfolioError ? (
                <Alert severity="error">{portfolioError}</Alert>
              ) : portfolio ? (
                <Box>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                    <Avatar src={portfolio.profile?.logoUrl || undefined} sx={{ width: 64, height: 64 }}>
                      {portfolio.profile?.name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {portfolio.profile?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {portfolio.profile?.city}
                      </Typography>
                      {portfolio.profile?.about && (
                        <Typography variant="body2" sx={{ mt: 1 }}>{portfolio.profile.about}</Typography>
                      )}
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Published projects</Typography>
                  {(portfolio.projects || []).length === 0 ? (
                    <Alert severity="info">This developer has not published any projects yet.</Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {portfolio.projects.map((p) => (
                        <Grid item xs={12} sm={6} key={p.id}>
                          <Card variant="outlined" sx={{ height: '100%' }}>
                            {p.coverImageUrl ? (
                              <Box component="img" src={p.coverImageUrl} alt={p.name}
                                sx={{ width: '100%', height: 140, objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : null}
                            <CardContent>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, my: 1, flexWrap: 'wrap' }}>
                                {p.type && <Chip size="small" label={p.type} />}
                                {p.status && <Chip size="small" label={p.status} />}
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                {[p.location?.area, p.location?.city].filter(Boolean).join(', ')}
                              </Typography>
                              {p.description && (
                                <Typography variant="body2" sx={{ mt: 1 }}>{p.description}</Typography>
                              )}
                              {p.priceRange && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  Price: {fmt(p.priceRange.min)} – {fmt(p.priceRange.max)}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              ) : (
                <Alert severity="info">No portfolio details available.</Alert>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <StatusBadge status={selected.partnershipStatus} />
              </Box>
              <Button onClick={closeDetail}>Close</Button>
              {selected.partnershipStatus === 'none' && (
                <Button variant="contained" onClick={openApply}>Apply to partner</Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Apply dialog */}
      <Dialog open={applyOpen} onClose={() => !applying && setApplyOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply to partner with {selected?.name}</DialogTitle>
        <DialogContent dividers>
          {applyError && <Alert severity="error" sx={{ mb: 2 }}>{applyError}</Alert>}
          <TextField fullWidth multiline minRows={4} label="Message to the developer"
            placeholder="Introduce your firm and why you'd like to partner."
            value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)}
            disabled={applying} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setApplyOpen(false)} disabled={applying}>Cancel</Button>
          <Button variant="contained" onClick={submitApply} disabled={applying}>
            {applying ? 'Sending…' : 'Send application'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CpMarketplacePage;

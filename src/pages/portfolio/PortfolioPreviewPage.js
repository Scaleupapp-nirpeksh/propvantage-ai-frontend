import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Avatar, Chip, Alert, CircularProgress, Divider,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { portfolioAPI } from '../../services/api';

const fmt = (n) => (n == null ? '—' : `₹${(Number(n) / 10000000).toFixed(2)} Cr`);

const PortfolioPreviewPage = () => {
  const { organization } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!organization?._id) return;
    portfolioAPI.getPortfolio(organization._id)
      .then((res) => setData(res.data?.data || null))
      .catch(() => setError('Could not load your portfolio.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?._id]);

  if (error) return <Box sx={{ py: 6 }}><Alert severity="error">{error}</Alert></Box>;
  if (!data) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;

  const { profile, projects } = data;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        This is how channel partners see your portfolio.
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Avatar src={profile.logoUrl || undefined} sx={{ width: 64, height: 64 }}>
            {profile.name?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{profile.name}</Typography>
            <Typography variant="body2" color="text.secondary">{profile.city}</Typography>
            {profile.about && <Typography variant="body2" sx={{ mt: 1 }}>{profile.about}</Typography>}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {[profile.contact?.phone, profile.contact?.website].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {projects.length === 0 ? (
        <Alert severity="info">Publish a project to build your portfolio.</Alert>
      ) : (
        <Grid container spacing={2}>
          {projects.map((p) => (
            <Grid item xs={12} md={6} key={p.id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                {p.coverImageUrl ? (
                  <Box component="img" src={p.coverImageUrl} alt={p.name}
                    sx={{ width: '100%', height: 160, objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }} />
                ) : null}
                <CardContent>
                  <Typography variant="h6">{p.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, my: 1, flexWrap: 'wrap' }}>
                    <Chip size="small" label={p.type} />
                    <Chip size="small" label={p.status} />
                    {p.reraNumber && <Chip size="small" variant="outlined" label={`RERA: ${p.reraNumber}`} />}
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
                  {p.amenities?.length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {p.amenities.slice(0, 6).join(' · ')}
                    </Typography>
                  )}
                  {p.configurationSummary && (
                    <Box sx={{ mt: 1 }}>
                      <Divider sx={{ mb: 1 }} />
                      {p.configurationSummary.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">No current availability</Typography>
                      ) : p.configurationSummary.map((c) => (
                        <Typography variant="body2" key={c.type}>
                          {c.type}: {c.availableCount} available · {c.sizeRange?.min ?? '—'}–{c.sizeRange?.max ?? '—'} sqft · {fmt(c.priceRange?.min)}–{fmt(c.priceRange?.max)}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default PortfolioPreviewPage;

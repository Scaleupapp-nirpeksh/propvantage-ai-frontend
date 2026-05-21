import React, { useEffect, useState } from 'react';
import {
  Box, Typography, TextField, Button, Grid, Alert, CircularProgress,
} from '@mui/material';
import { portfolioAPI } from '../../services/api';

const PortfolioProfilePage = () => {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    portfolioAPI.getProfile()
      .then((res) => {
        const org = res.data?.data || {};
        setForm({
          logoUrl: org.portfolioProfile?.logoUrl || '',
          about: org.portfolioProfile?.about || '',
          phone: org.contactInfo?.phone || '',
          website: org.contactInfo?.website || '',
          address: org.contactInfo?.address || '',
        });
      })
      .catch(() => setError('Could not load your portfolio profile.'));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true); setError(''); setOk('');
    try {
      await portfolioAPI.updateProfile({
        logoUrl: form.logoUrl,
        about: form.about,
        contactInfo: { phone: form.phone, website: form.website, address: form.address },
      });
      setOk('Profile saved.');
    } catch (e) {
      setError(e.response?.data?.message || 'Could not save the profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      {error ? <Alert severity="error">{error}</Alert> : <CircularProgress />}
    </Box>;
  }

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Portfolio — Public Profile</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        This is what channel partners see at the top of your portfolio.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField fullWidth label="Logo image URL" value={form.logoUrl} onChange={set('logoUrl')} disabled={saving} />
        </Grid>
        {form.logoUrl ? (
          <Grid item xs={12}>
            <Box component="img" src={form.logoUrl} alt="logo"
              sx={{ maxHeight: 80, borderRadius: 1 }}
              onError={(e) => { e.target.style.display = 'none'; }} />
          </Grid>
        ) : null}
        <Grid item xs={12}>
          <TextField fullWidth multiline rows={4} label="About" value={form.about} onChange={set('about')} disabled={saving} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Public phone" value={form.phone} onChange={set('phone')} disabled={saving} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Website" value={form.website} onChange={set('website')} disabled={saving} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Address" value={form.address} onChange={set('address')} disabled={saving} />
        </Grid>
      </Grid>
      <Button variant="contained" sx={{ mt: 3 }} onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save profile'}
      </Button>
    </Box>
  );
};

export default PortfolioProfilePage;

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, TextField, MenuItem, Button, Grid, Alert, CircularProgress,
} from '@mui/material';
import { cpPortalAPI } from '../../services/api';
import { CP_CATEGORY_OPTIONS } from '../../constants/channelPartnerCategories';

const CpPortalProfilePage = () => {
  const [org, setOrg] = useState(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cpPortalAPI.getOrgProfile()
      .then((res) => setOrg(res.data?.data || null))
      .catch(() => setError('Could not load your organization profile.'));
  }, []);

  const setField = (k) => (e) => setOrg((o) => ({ ...o, [k]: e.target.value }));
  const setContact = (k) => (e) =>
    setOrg((o) => ({ ...o, contactInfo: { ...(o.contactInfo || {}), [k]: e.target.value } }));
  const setMarketing = (k) => (e) =>
    setOrg((o) => ({
      ...o,
      channelPartnerProfile: { ...(o.channelPartnerProfile || {}), [k]: e.target.value },
    }));

  const save = async () => {
    setSaving(true); setError(''); setOk('');
    try {
      const cpp = org.channelPartnerProfile || {};
      const areasServed = String(cpp.areasServed ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await cpPortalAPI.updateOrgProfile({
        name: org.name, category: org.category, country: org.country, city: org.city,
        contactInfo: org.contactInfo,
        channelPartnerProfile: {
          logoUrl: cpp.logoUrl || '',
          about: cpp.about || '',
          areasServed,
          trackRecord: cpp.trackRecord || '',
        },
      });
      setOrg(res.data?.data || org);
      setOk('Profile saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the profile.');
    } finally {
      setSaving(false);
    }
  };

  // areasServed comes back from the API as an array; the text field edits a CSV string.
  const cpp = org?.channelPartnerProfile || {};
  const areasServedValue = Array.isArray(cpp.areasServed)
    ? cpp.areasServed.join(', ')
    : (cpp.areasServed || '');

  if (!org) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      {error ? <Alert severity="error">{error}</Alert> : <CircularProgress />}
    </Box>;
  }

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Organization Profile</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {ok && <Alert severity="success" sx={{ mb: 2 }}>{ok}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField fullWidth label="Firm name" value={org.name || ''} onChange={setField('name')}
            disabled={saving} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth select label="Category" value={org.category || ''} onChange={setField('category')}
            disabled={saving}>
            {CP_CATEGORY_OPTIONS.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="RERA registration number"
            value={org.reraRegistrationNumber || ''} InputProps={{ readOnly: true }}
            helperText="Set at registration — contact support to change." />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Country" value={org.country || ''} onChange={setField('country')}
            disabled={saving} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="City" value={org.city || ''} onChange={setField('city')}
            disabled={saving} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Phone" value={org.contactInfo?.phone || ''} onChange={setContact('phone')}
            disabled={saving} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Website" value={org.contactInfo?.website || ''} onChange={setContact('website')}
            disabled={saving} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Address" value={org.contactInfo?.address || ''} onChange={setContact('address')}
            disabled={saving} />
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ fontWeight: 700, mt: 4, mb: 1 }}>
        Marketplace profile
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        This is how developers see your firm in their marketplace.
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField fullWidth label="Logo URL" value={cpp.logoUrl || ''}
            onChange={setMarketing('logoUrl')} disabled={saving}
            placeholder="https://…" />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline minRows={3} label="About your firm"
            value={cpp.about || ''} onChange={setMarketing('about')} disabled={saving} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Areas served" value={areasServedValue}
            onChange={setMarketing('areasServed')} disabled={saving}
            helperText="Comma-separated, e.g. Bandra, Andheri, Powai" />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline minRows={3} label="Track record"
            value={cpp.trackRecord || ''} onChange={setMarketing('trackRecord')}
            disabled={saving}
            helperText="Highlight your sales experience and notable achievements." />
        </Grid>
      </Grid>

      <Button variant="contained" sx={{ mt: 3 }} onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save profile'}
      </Button>
    </Box>
  );
};

export default CpPortalProfilePage;

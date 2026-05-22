import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, TextField, MenuItem, Button, Typography, Alert, CircularProgress, Grid,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { CP_CATEGORY_OPTIONS } from '../../constants/channelPartnerCategories';
import { partnershipAPI } from '../../services/api';

const ChannelPartnerRegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('inviteToken');
  const cpId = searchParams.get('cpId');
  const hasInvite = Boolean(inviteToken && cpId);

  const [form, setForm] = useState({
    orgName: '', category: '', reraRegistrationNumber: '', country: 'India', city: '',
    firstName: '', lastName: '', email: '', password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Off-platform invite state
  const [inviteLoading, setInviteLoading] = useState(hasInvite);
  const [inviteInfo, setInviteInfo] = useState(null); // { developerName, firmName, email, category }
  const [inviteWarning, setInviteWarning] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // On mount, if invite params are present, look up the invite and pre-fill.
  useEffect(() => {
    if (!hasInvite) return;
    let cancelled = false;
    setInviteLoading(true);
    partnershipAPI.getOffPlatformInvite(cpId, inviteToken)
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data || {};
        setInviteInfo(data);
        setForm((f) => ({
          ...f,
          orgName: data.firmName || f.orgName,
          email: data.email || f.email,
          category: data.category || f.category,
        }));
      })
      .catch(() => {
        if (cancelled) return;
        setInviteWarning(
          'This invite link is invalid or has already been used. '
          + 'You can still register normally below.',
        );
      })
      .finally(() => {
        if (!cancelled) setInviteLoading(false);
      });
    return () => { cancelled = true; };
  }, [hasInvite, cpId, inviteToken]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const required = ['orgName', 'category', 'reraRegistrationNumber', 'country', 'city',
      'firstName', 'lastName', 'email', 'password'];
    for (const k of required) {
      if (!String(form[k]).trim()) { setError('Please fill in all fields.'); return; }
    }
    setLoading(true);
    try {
      const result = await register({ ...form, type: 'channel_partner' });
      if (result?.success) {
        // If this registration came from an off-platform invite, claim it
        // before navigating. A failed claim must not block the new account.
        if (hasInvite) {
          try {
            await partnershipAPI.claimInvite({ channelPartnerId: cpId, token: inviteToken });
          } catch {
            // Soft failure — account is valid, partnership link can be retried later.
          }
        }
        navigate('/partner/dashboard');
      } else {
        setError(result?.error || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={submit} sx={{ maxWidth: 520, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Register your channel partner organization
      </Typography>

      {inviteLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Checking your invite…
          </Typography>
        </Box>
      )}
      {inviteInfo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You&apos;ve been invited by {inviteInfo.developerName} to join PropVantage
          as their channel partner.
        </Alert>
      )}
      {inviteWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>{inviteWarning}</Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField fullWidth label="Firm name" value={form.orgName} onChange={set('orgName')} disabled={loading} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth select label="Category" value={form.category} onChange={set('category')} disabled={loading}>
            {CP_CATEGORY_OPTIONS.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="RERA registration number"
            value={form.reraRegistrationNumber} onChange={set('reraRegistrationNumber')} disabled={loading} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Country" value={form.country} onChange={set('country')} disabled={loading} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="City" value={form.city} onChange={set('city')} disabled={loading} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Your first name" value={form.firstName} onChange={set('firstName')} disabled={loading} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Your last name" value={form.lastName} onChange={set('lastName')} disabled={loading} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} disabled={loading} autoComplete="email" />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Password" type="password" value={form.password} onChange={set('password')} disabled={loading} autoComplete="new-password" />
        </Grid>
      </Grid>
      <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null} sx={{ mt: 3 }}>
        {loading ? 'Creating account…' : 'Create channel partner account'}
      </Button>
    </Box>
  );
};

export default ChannelPartnerRegisterPage;

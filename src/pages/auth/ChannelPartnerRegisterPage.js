import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, MenuItem, Button, Typography, Alert, CircularProgress, Grid,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  { value: 'individual_agent', label: 'Individual Agent' },
  { value: 'broker_firm', label: 'Broker Firm' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'digital_aggregator', label: 'Digital Aggregator' },
];

const ChannelPartnerRegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    orgName: '', category: '', reraRegistrationNumber: '', country: 'India', city: '',
    firstName: '', lastName: '', email: '', password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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
      if (result?.success) navigate('/partner/dashboard');
      else setError(result?.error || 'Registration failed.');
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
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField fullWidth label="Firm name" value={form.orgName} onChange={set('orgName')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth select label="Category" value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="RERA registration number"
            value={form.reraRegistrationNumber} onChange={set('reraRegistrationNumber')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Country" value={form.country} onChange={set('country')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="City" value={form.city} onChange={set('city')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Your first name" value={form.firstName} onChange={set('firstName')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Your last name" value={form.lastName} onChange={set('lastName')} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Email" type="email" value={form.email} onChange={set('email')} />
        </Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Password" type="password" value={form.password} onChange={set('password')} />
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

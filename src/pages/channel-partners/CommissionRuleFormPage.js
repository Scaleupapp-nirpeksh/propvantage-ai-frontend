// File: src/pages/channel-partners/CommissionRuleFormPage.js
// Description: Create / edit a channel-partner commission rule.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, MenuItem, Button, Grid, Card, CardContent,
  Stack, Divider, IconButton, Alert, CircularProgress, Autocomplete,
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';
import { channelPartnerAPI, projectAPI } from '../../services/api';

const TRIGGERS = [
  { value: 'on_booking', label: 'On booking' },
  { value: 'on_agreement', label: 'On agreement' },
  { value: 'on_registration', label: 'On registration' },
  { value: 'on_possession', label: 'On possession' },
];

const emptyForm = {
  name: '', description: '', appliesToProject: null,
  rate: { method: 'percentage', percentage: 2, flatAmount: 0, basis: 'sale_price' },
  payout: { schedule: 'lump_sum', tranches: [] },
  tdsPercent: 5, status: 'active',
};

const CommissionRuleFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    projectAPI.getProjects()
      .then((res) => setProjects(res.data?.data || res.data || []))
      .catch(() => setProjects([]));
  }, []);

  const load = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const res = await channelPartnerAPI.getCommissionRule(id);
      const d = res.data.data;
      setForm({
        ...emptyForm, ...d,
        appliesToProject: d.appliesToProject?._id || d.appliesToProject || null,
        rate: { ...emptyForm.rate, ...d.rate },
        payout: {
          schedule: d.payout?.schedule || 'lump_sum',
          tranches: (d.payout?.tranches || []).map((t, i) => ({ ...t, _key: `t${i}` })),
        },
      });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load rule.');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    load();
  }, [load]);

  const setRate = (k, v) => setForm((p) => ({ ...p, rate: { ...p.rate, [k]: v } }));
  const setTranche = (i, k, v) => setForm((p) => {
    const tranches = [...p.payout.tranches];
    tranches[i] = { ...tranches[i], [k]: v };
    return { ...p, payout: { ...p.payout, tranches } };
  });
  const addTranche = () => setForm((p) => ({
    ...p,
    payout: {
      ...p.payout,
      tranches: [
        ...p.payout.tranches,
        { label: '', percentage: 0, trigger: 'on_booking', _key: `t${Date.now()}${Math.random()}` },
      ],
    },
  }));
  const removeTranche = (i) => setForm((p) => ({
    ...p, payout: { ...p.payout, tranches: p.payout.tranches.filter((_, idx) => idx !== i) },
  }));

  const trancheSum = form.payout.tranches.reduce((a, t) => a + (Number(t.percentage) || 0), 0);

  const save = async () => {
    if (!form.name.trim()) {
      setError('Rule name is required.');
      return;
    }
    if (form.payout.schedule === 'tranches' && Math.round(trancheSum) !== 100) {
      setError(`Tranche percentages must sum to 100 (currently ${trancheSum}).`);
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      rate: {
        ...form.rate,
        percentage: Number(form.rate.percentage) || 0,
        flatAmount: Number(form.rate.flatAmount) || 0,
      },
      tdsPercent: Number(form.tdsPercent) || 0,
      payout: {
        schedule: form.payout.schedule,
        tranches: form.payout.schedule === 'tranches'
          ? form.payout.tranches.map((t) => ({
              label: t.label,
              percentage: Number(t.percentage) || 0,
              trigger: t.trigger,
            }))
          : [],
      },
    };
    try {
      if (isEdit) {
        await channelPartnerAPI.updateCommissionRule(id, payload);
      } else {
        await channelPartnerAPI.createCommissionRule(payload);
      }
      navigate('/channel-partners/commission-rules');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save rule.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        {isEdit ? 'Edit Commission Rule' : 'Add Commission Rule'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Rule name" required value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Status" value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={projects}
                value={projects.find((p) => p._id === form.appliesToProject) || null}
                getOptionLabel={(o) => o.name || ''}
                isOptionEqualToValue={(o, v) => o._id === v._id}
                onChange={(e, val) => setForm((p) => ({ ...p, appliesToProject: val?._id || null }))}
                renderInput={(params) => (
                  <TextField {...params} label="Applies to project (leave blank = all projects)" />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Rate</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth select label="Method" value={form.rate.method}
                onChange={(e) => setRate('method', e.target.value)}>
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="flat">Flat amount</MenuItem>
              </TextField>
            </Grid>
            {form.rate.method === 'percentage' ? (
              <>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth type="number" label="Percentage" value={form.rate.percentage}
                    onChange={(e) => setRate('percentage', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth select label="Basis" value={form.rate.basis}
                    onChange={(e) => setRate('basis', e.target.value)}>
                    <MenuItem value="sale_price">Sale price</MenuItem>
                    <MenuItem value="base_price">Base price</MenuItem>
                  </TextField>
                </Grid>
              </>
            ) : (
              <Grid item xs={12} sm={3}>
                <TextField fullWidth type="number" label="Flat amount (₹)" value={form.rate.flatAmount}
                  onChange={(e) => setRate('flatAmount', e.target.value)} />
              </Grid>
            )}
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="number" label="TDS %" value={form.tdsPercent}
                onChange={(e) => setForm((p) => ({ ...p, tdsPercent: e.target.value }))} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Payout schedule</Typography>
          <TextField select label="Schedule" value={form.payout.schedule} sx={{ minWidth: 220, mb: 2 }}
            onChange={(e) => setForm((p) => ({ ...p, payout: { ...p.payout, schedule: e.target.value } }))}>
            <MenuItem value="lump_sum">Lump sum</MenuItem>
            <MenuItem value="tranches">Tranches</MenuItem>
          </TextField>

          {form.payout.schedule === 'tranches' && (
            <Box>
              {form.payout.tranches.map((t, i) => (
                <Stack key={t._key || i} direction="row" spacing={1} sx={{ mb: 1 }} alignItems="center">
                  <TextField label="Label" value={t.label} sx={{ flex: 2 }}
                    onChange={(e) => setTranche(i, 'label', e.target.value)} />
                  <TextField label="%" type="number" value={t.percentage} sx={{ flex: 1 }}
                    onChange={(e) => setTranche(i, 'percentage', e.target.value)} />
                  <TextField select label="Trigger" value={t.trigger} sx={{ flex: 2 }}
                    onChange={(e) => setTranche(i, 'trigger', e.target.value)}>
                    {TRIGGERS.map((tr) => (
                      <MenuItem key={tr.value} value={tr.value}>{tr.label}</MenuItem>
                    ))}
                  </TextField>
                  <IconButton onClick={() => removeTranche(i)}><Delete /></IconButton>
                </Stack>
              ))}
              <Button size="small" startIcon={<Add />} onClick={addTranche}>Add tranche</Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}
                color={Math.round(trancheSum) === 100 ? 'text.secondary' : 'error'}>
                Tranche total: {trancheSum}% (must be 100%)
              </Typography>
            </Box>
          )}

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="contained" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create rule'}
            </Button>
            <Button onClick={() => navigate('/channel-partners/commission-rules')} disabled={saving}>
              Cancel
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CommissionRuleFormPage;

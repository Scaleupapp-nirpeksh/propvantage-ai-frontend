// File: src/pages/channel-partners/ChannelPartnerFormPage.js
// Description: Create / edit a channel partner firm, with inline agent management.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, MenuItem, Button, Grid, Card, CardContent,
  Stack, Divider, Table, TableBody, TableCell, TableHead, TableRow, Alert,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete,
} from '@mui/material';
import { channelPartnerAPI, projectAPI } from '../../services/api';

const emptyForm = {
  firmName: '', reraRegistrationNumber: '', pan: '', gstin: '',
  primaryContact: { name: '', email: '', phone: '' },
  address: '', status: 'active', category: 'broker_firm',
  approvedProjects: [],
  bankDetails: { accountName: '', accountNumber: '', ifsc: '', bankName: '' },
  agreementNotes: '',
};

const ChannelPartnerFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(emptyForm);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [agentDialog, setAgentDialog] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: '', email: '', phone: '', reraAgentNumber: '' });
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    projectAPI.getProjects()
      .then((res) => setProjects(res.data?.data || res.data || []))
      .catch(() => setProjects([]));
  }, []);

  const load = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const res = await channelPartnerAPI.getChannelPartner(id);
      const d = res.data.data;
      setForm({
        ...emptyForm, ...d,
        primaryContact: { ...emptyForm.primaryContact, ...d.primaryContact },
        bankDetails: { ...emptyForm.bankDetails, ...d.bankDetails },
        approvedProjects: (d.approvedProjects || []).map((p) => p._id || p),
      });
      setAgents(d.agents || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load partner.');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (path, value) => {
    setForm((prev) => {
      if (path.includes('.')) {
        const [group, key] = path.split('.');
        return { ...prev, [group]: { ...prev[group], [key]: value } };
      }
      return { ...prev, [path]: value };
    });
  };

  const save = async () => {
    if (!form.firmName.trim()) {
      setError('Firm name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await channelPartnerAPI.updateChannelPartner(id, form);
        navigate(`/channel-partners/${id}`);
      } else {
        const res = await channelPartnerAPI.createChannelPartner(form);
        const created = res.data?.data;
        navigate(created?._id ? `/channel-partners/${created._id}` : '/channel-partners');
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save partner.');
    } finally {
      setSaving(false);
    }
  };

  const addAgent = async () => {
    if (!agentForm.name.trim()) return;
    try {
      const res = await channelPartnerAPI.createAgent(id, agentForm);
      setAgents((prev) => [...prev, res.data.data]);
      setAgentDialog(false);
      setAgentForm({ name: '', email: '', phone: '', reraAgentNumber: '' });
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add agent.');
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
        {isEdit ? 'Edit Channel Partner' : 'Add Channel Partner'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Firm details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Firm name" required value={form.firmName}
                onChange={(e) => setField('firmName', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Status" value={form.status}
                onChange={(e) => setField('status', e.target.value)}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="blacklisted">Blacklisted</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Category" value={form.category}
                onChange={(e) => setField('category', e.target.value)}>
                <MenuItem value="broker_firm">Broker Firm</MenuItem>
                <MenuItem value="individual_agent">Individual Agent</MenuItem>
                <MenuItem value="corporate">Corporate</MenuItem>
                <MenuItem value="digital_aggregator">Digital Aggregator</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="RERA registration no." value={form.reraRegistrationNumber}
                onChange={(e) => setField('reraRegistrationNumber', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="PAN" value={form.pan}
                onChange={(e) => setField('pan', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="GSTIN" value={form.gstin}
                onChange={(e) => setField('gstin', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" value={form.address}
                onChange={(e) => setField('address', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={projects}
                value={projects.filter((p) => form.approvedProjects.includes(p._id))}
                getOptionLabel={(o) => o.name || ''}
                isOptionEqualToValue={(o, v) => o._id === v._id}
                onChange={(e, vals) => setField('approvedProjects', vals.map((v) => v._id))}
                renderInput={(params) => (
                  <TextField {...params} label="Approved projects"
                    placeholder="Projects this partner may sell" />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Primary contact</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Contact name" value={form.primaryContact.name}
                onChange={(e) => setField('primaryContact.name', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Contact email" value={form.primaryContact.email}
                onChange={(e) => setField('primaryContact.email', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Contact phone" value={form.primaryContact.phone}
                onChange={(e) => setField('primaryContact.phone', e.target.value)} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>Bank details (for payouts)</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Account name" value={form.bankDetails.accountName}
                onChange={(e) => setField('bankDetails.accountName', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Account number" value={form.bankDetails.accountNumber}
                onChange={(e) => setField('bankDetails.accountNumber', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="IFSC" value={form.bankDetails.ifsc}
                onChange={(e) => setField('bankDetails.ifsc', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Bank name" value={form.bankDetails.bankName}
                onChange={(e) => setField('bankDetails.bankName', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Agreement notes" value={form.agreementNotes}
                onChange={(e) => setField('agreementNotes', e.target.value)} />
            </Grid>
          </Grid>

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button variant="contained" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create partner'}
            </Button>
            <Button onClick={() => navigate('/channel-partners')} disabled={saving}>Cancel</Button>
          </Stack>
        </CardContent>
      </Card>

      {isEdit && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Agents</Typography>
              <Button size="small" variant="outlined" onClick={() => setAgentDialog(true)}>
                Add agent
              </Button>
            </Box>
            {agents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No agents yet.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>RERA agent no.</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agents.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>{a.phone || '—'}</TableCell>
                      <TableCell>{a.email || '—'}</TableCell>
                      <TableCell>{a.reraAgentNumber || '—'}</TableCell>
                      <TableCell>{a.status || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={agentDialog} onClose={() => setAgentDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add agent</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" required value={agentForm.name}
              onChange={(e) => setAgentForm((p) => ({ ...p, name: e.target.value }))} />
            <TextField label="Phone" value={agentForm.phone}
              onChange={(e) => setAgentForm((p) => ({ ...p, phone: e.target.value }))} />
            <TextField label="Email" value={agentForm.email}
              onChange={(e) => setAgentForm((p) => ({ ...p, email: e.target.value }))} />
            <TextField label="RERA agent no." value={agentForm.reraAgentNumber}
              onChange={(e) => setAgentForm((p) => ({ ...p, reraAgentNumber: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAgentDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={addAgent}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChannelPartnerFormPage;

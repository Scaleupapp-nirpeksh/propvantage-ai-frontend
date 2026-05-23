// File: src/pages/cp-portal/ExternalDevelopersListPage.js
// SP4 — Off-platform developers directory with side-drawer detail + invite flow.

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, Chip, Stack, CircularProgress,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton,
  Drawer, Divider, InputAdornment, Tooltip,
} from '@mui/material';
import {
  Add, Refresh, Close, Send, ContentCopy, Delete, Edit, Verified,
} from '@mui/icons-material';
import { cpExternalDevelopersAPI } from '../../services/api';

const emptyForm = {
  name: '',
  description: '',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  city: '',
  projects: [], // [{name,location,type,notes}]
};

const ExternalDevelopersListPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ ok: '', err: '' });

  const [search, setSearch] = useState('');

  // Create dialog
  const [openCreate, setOpenCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);

  // Drawer (view + edit)
  const [drawerId, setDrawerId] = useState(null);
  const [drawerDoc, setDrawerDoc] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editBusy, setEditBusy] = useState(false);

  // Invite dialog
  const [openInvite, setOpenInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteResult, setInviteResult] = useState(null); // { inviteUrl, email, expiresAt }
  const [copyOk, setCopyOk] = useState(false);

  // Delete
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    cpExternalDevelopersAPI.list(search ? { search } : undefined)
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load developers.'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const showOk = (msg) => setSnack({ ok: msg, err: '' });
  const showErr = (msg) => setSnack({ ok: '', err: msg });

  const openDetail = (id) => {
    setDrawerId(id);
    setDrawerDoc(null);
    setEditing(false);
    setInviteResult(null);
    setDrawerLoading(true);
    cpExternalDevelopersAPI.get(id)
      .then((res) => {
        const doc = res.data?.data || res.data;
        setDrawerDoc(doc);
        setEditForm({
          name: doc.name || '',
          description: doc.description || '',
          contactPerson: doc.contact?.person || '',
          contactEmail: doc.contact?.email || '',
          contactPhone: doc.contact?.phone || '',
          address: doc.address || '',
          city: doc.city || '',
          projects: doc.projects || [],
        });
      })
      .catch((err) => showErr(err.response?.data?.message || 'Could not load developer.'))
      .finally(() => setDrawerLoading(false));
  };

  const closeDrawer = () => {
    setDrawerId(null);
    setDrawerDoc(null);
    setEditing(false);
    setInviteResult(null);
  };

  const buildPayload = (f) => ({
    name: f.name.trim(),
    description: f.description.trim() || undefined,
    contact: {
      person: f.contactPerson.trim() || undefined,
      email: f.contactEmail.trim() || undefined,
      phone: f.contactPhone.trim() || undefined,
    },
    address: f.address.trim() || undefined,
    city: f.city.trim() || undefined,
    projects: f.projects,
  });

  const submitCreate = async () => {
    if (!createForm.name.trim()) { showErr('Name is required.'); return; }
    setCreating(true);
    try {
      await cpExternalDevelopersAPI.create(buildPayload(createForm));
      setOpenCreate(false);
      setCreateForm(emptyForm);
      showOk('Developer added.');
      load();
    } catch (err) {
      showErr(err.response?.data?.message || 'Could not add developer.');
    } finally {
      setCreating(false);
    }
  };

  const submitEdit = async () => {
    if (!editForm.name.trim()) { showErr('Name is required.'); return; }
    setEditBusy(true);
    try {
      const res = await cpExternalDevelopersAPI.update(drawerId, buildPayload(editForm));
      const doc = res.data?.data || res.data;
      setDrawerDoc(doc);
      setEditing(false);
      showOk('Developer updated.');
      load();
    } catch (err) {
      showErr(err.response?.data?.message || 'Could not update.');
    } finally {
      setEditBusy(false);
    }
  };

  const submitInvite = async () => {
    if (!inviteEmail.trim()) { showErr('Email is required.'); return; }
    setInviteBusy(true);
    try {
      const res = await cpExternalDevelopersAPI.invite(drawerId, { email: inviteEmail.trim() });
      const data = res.data?.data || res.data;
      setInviteResult({
        inviteUrl: data.inviteUrl,
        email: data.email,
        expiresAt: data.expiresAt,
      });
      // Refresh drawer doc so invite metadata is current
      openDetail(drawerId);
      showOk('Invite generated.');
    } catch (err) {
      showErr(err.response?.data?.message || 'Could not send invite.');
    } finally {
      setInviteBusy(false);
    }
  };

  const copyInvite = async () => {
    if (!inviteResult?.inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteResult.inviteUrl);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 2000);
    } catch {
      setCopyOk(false);
    }
  };

  const handleDelete = async () => {
    if (!drawerId) return;
    if (!window.confirm('Delete this developer? This cannot be undone.')) return;
    setDeleteBusy(true);
    try {
      await cpExternalDevelopersAPI.delete(drawerId);
      closeDrawer();
      showOk('Developer deleted.');
      load();
    } catch (err) {
      showErr(err.response?.data?.message || 'Could not delete (developer may be claimed or have linked prospects).');
    } finally {
      setDeleteBusy(false);
    }
  };

  const addProjectRow = (which) => {
    const setter = which === 'create' ? setCreateForm : setEditForm;
    setter((f) => ({ ...f, projects: [...f.projects, { name: '', location: '', type: '', notes: '' }] }));
  };
  const removeProjectRow = (which, idx) => {
    const setter = which === 'create' ? setCreateForm : setEditForm;
    setter((f) => ({ ...f, projects: f.projects.filter((_, i) => i !== idx) }));
  };
  const setProjectField = (which, idx, key) => (e) => {
    const setter = which === 'create' ? setCreateForm : setEditForm;
    setter((f) => ({
      ...f,
      projects: f.projects.map((p, i) => i === idx ? { ...p, [key]: e.target.value } : p),
    }));
  };

  const renderProjectsEditor = (which, form) => (
    <Box sx={{ mt: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle2">Projects</Typography>
        <Button size="small" startIcon={<Add />} onClick={() => addProjectRow(which)}>Add</Button>
      </Stack>
      {form.projects.length === 0 && (
        <Typography variant="caption" color="text.secondary">No projects yet.</Typography>
      )}
      {form.projects.map((p, idx) => (
        <Grid container spacing={1} key={idx} sx={{ mb: 1 }}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Name" value={p.name}
              onChange={setProjectField(which, idx, 'name')} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth size="small" label="Location" value={p.location}
              onChange={setProjectField(which, idx, 'location')} />
          </Grid>
          <Grid item xs={8} sm={3}>
            <TextField fullWidth size="small" label="Type" value={p.type}
              onChange={setProjectField(which, idx, 'type')} />
          </Grid>
          <Grid item xs={4} sm={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small" onClick={() => removeProjectRow(which, idx)}>
              <Delete fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      ))}
    </Box>
  );

  const isInviteActive = (doc) => {
    const inv = doc?.invite;
    if (!inv?.token) return false;
    if (!inv.expiresAt) return true;
    return new Date(inv.expiresAt) > new Date();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Off-Platform Developers</Typography>
          <Typography variant="body2" color="text.secondary">
            Track and invite developers who are not yet on the platform.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <TextField size="small" placeholder="Search…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start" /> }} />
          <Tooltip title="Refresh"><IconButton onClick={load}><Refresh /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setCreateForm(emptyForm); setOpenCreate(true); }}>
            Add Developer
          </Button>
        </Stack>
      </Box>

      {snack.ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSnack({ ok: '', err: '' })}>{snack.ok}</Alert>}
      {snack.err && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSnack({ ok: '', err: '' })}>{snack.err}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : items.length === 0 ? (
        <Alert severity="info">No off-platform developers yet. Click "Add Developer" to create one.</Alert>
      ) : (
        <Grid container spacing={2}>
          {items.map((d) => (
            <Grid item xs={12} sm={6} md={4} key={d._id}>
              <Card variant="outlined" sx={{ height: '100%', cursor: 'pointer' }} onClick={() => openDetail(d._id)}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                      {d.name}
                    </Typography>
                    {d.claimedByOrg && (
                      <Chip size="small" icon={<Verified fontSize="small" />} label="Claimed" color="success" />
                    )}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" noWrap>{d.city || '—'}</Typography>
                  {d.contact?.person && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Contact: {d.contact.person}
                    </Typography>
                  )}
                  {d.projects?.length > 0 && (
                    <Chip size="small" variant="outlined" sx={{ mt: 1 }}
                      label={`${d.projects.length} project${d.projects.length === 1 ? '' : 's'}`} />
                  )}
                  {isInviteActive(d) && !d.claimedByOrg && (
                    <Chip size="small" color="warning" variant="outlined" sx={{ mt: 1, ml: 1 }} label="Invite sent" />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create dialog */}
      <Dialog open={openCreate} onClose={() => !creating && setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Off-Platform Developer</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth size="small" required label="Name"
                value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="City"
                value={createForm.city} onChange={(e) => setCreateForm((f) => ({ ...f, city: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline minRows={2} label="Description"
                value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Contact Person"
                value={createForm.contactPerson} onChange={(e) => setCreateForm((f) => ({ ...f, contactPerson: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Contact Email" type="email"
                value={createForm.contactEmail} onChange={(e) => setCreateForm((f) => ({ ...f, contactEmail: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth size="small" label="Contact Phone"
                value={createForm.contactPhone} onChange={(e) => setCreateForm((f) => ({ ...f, contactPhone: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Address"
                value={createForm.address} onChange={(e) => setCreateForm((f) => ({ ...f, address: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              {renderProjectsEditor('create', createForm)}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenCreate(false)} disabled={creating}>Cancel</Button>
          <Button variant="contained" onClick={submitCreate} disabled={creating}>
            {creating ? 'Saving…' : 'Add Developer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail drawer */}
      <Drawer anchor="right" open={!!drawerId} onClose={closeDrawer}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6">Developer Details</Typography>
          <IconButton onClick={closeDrawer}><Close /></IconButton>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        {drawerLoading || !drawerDoc ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <Box>
            {drawerDoc.claimedByOrg && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Claimed by{' '}
                <strong>
                  {typeof drawerDoc.claimedByOrg === 'object' ? drawerDoc.claimedByOrg.name : 'Developer Org'}
                </strong>
                {drawerDoc.claimedAt && ` on ${new Date(drawerDoc.claimedAt).toLocaleDateString()}`}.
                <Box sx={{ mt: 0.5 }}>
                  <a href="/partner/partnerships" style={{ color: 'inherit' }}>View partnership</a>
                </Box>
              </Alert>
            )}

            {!editing ? (
              <>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">{drawerDoc.name}</Typography>
                  <Button size="small" startIcon={<Edit />} onClick={() => setEditing(true)}
                    disabled={!!drawerDoc.claimedByOrg}>
                    Edit
                  </Button>
                </Stack>
                <Typography variant="body2" color="text.secondary">{drawerDoc.city || '—'}</Typography>
                {drawerDoc.description && (
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{drawerDoc.description}</Typography>
                )}
                <Divider sx={{ my: 2 }} />
                <Typography variant="overline" color="text.secondary">Contact</Typography>
                <Typography variant="body2">{drawerDoc.contact?.person || '—'}</Typography>
                <Typography variant="body2">{drawerDoc.contact?.email || '—'}</Typography>
                <Typography variant="body2">{drawerDoc.contact?.phone || '—'}</Typography>
                {drawerDoc.address && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{drawerDoc.address}</Typography>
                )}

                <Divider sx={{ my: 2 }} />
                <Typography variant="overline" color="text.secondary">Projects</Typography>
                {drawerDoc.projects?.length > 0 ? (
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {drawerDoc.projects.map((p, idx) => (
                      <Card key={idx} variant="outlined">
                        <CardContent sx={{ py: 1.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {[p.location, p.type].filter(Boolean).join(' · ') || '—'}
                          </Typography>
                          {p.notes && (
                            <Typography variant="caption" display="block" color="text.secondary">{p.notes}</Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No projects.</Typography>
                )}

                <Divider sx={{ my: 2 }} />
                <Typography variant="overline" color="text.secondary">Invite to Platform</Typography>
                {drawerDoc.claimedByOrg ? (
                  <Typography variant="body2" color="text.secondary">
                    This developer has already claimed their profile.
                  </Typography>
                ) : isInviteActive(drawerDoc) ? (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Invite sent to <strong>{drawerDoc.invite?.email}</strong>
                      {drawerDoc.invite?.invitedAt && ` on ${new Date(drawerDoc.invite.invitedAt).toLocaleDateString()}`}.
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Expires {drawerDoc.invite?.expiresAt ? new Date(drawerDoc.invite.expiresAt).toLocaleDateString() : '—'}
                    </Typography>
                    <Button size="small" startIcon={<Send />} sx={{ mt: 1 }}
                      onClick={() => { setInviteEmail(drawerDoc.invite?.email || ''); setOpenInvite(true); setInviteResult(null); }}>
                      Regenerate
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ mt: 1 }}>
                    <Button size="small" variant="contained" startIcon={<Send />}
                      onClick={() => { setInviteEmail(drawerDoc.contact?.email || ''); setOpenInvite(true); setInviteResult(null); }}>
                      Invite to Platform
                    </Button>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />
                <Button color="error" startIcon={<Delete />} onClick={handleDelete}
                  disabled={deleteBusy || !!drawerDoc.claimedByOrg}>
                  {deleteBusy ? 'Deleting…' : 'Delete'}
                </Button>
                {drawerDoc.claimedByOrg && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Claimed developers cannot be deleted.
                  </Typography>
                )}
              </>
            ) : (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <TextField fullWidth size="small" required label="Name"
                      value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="City"
                      value={editForm.city} onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" multiline minRows={2} label="Description"
                      value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Contact Person"
                      value={editForm.contactPerson} onChange={(e) => setEditForm((f) => ({ ...f, contactPerson: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Contact Email" type="email"
                      value={editForm.contactEmail} onChange={(e) => setEditForm((f) => ({ ...f, contactEmail: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth size="small" label="Contact Phone"
                      value={editForm.contactPhone} onChange={(e) => setEditForm((f) => ({ ...f, contactPhone: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" label="Address"
                      value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
                  </Grid>
                  <Grid item xs={12}>
                    {renderProjectsEditor('edit', editForm)}
                  </Grid>
                </Grid>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={submitEdit} disabled={editBusy}>
                    {editBusy ? 'Saving…' : 'Save'}
                  </Button>
                  <Button onClick={() => setEditing(false)} disabled={editBusy}>Cancel</Button>
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </Drawer>

      {/* Invite dialog */}
      <Dialog open={openInvite} onClose={() => !inviteBusy && setOpenInvite(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite to Platform</DialogTitle>
        <DialogContent dividers>
          {!inviteResult ? (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Generate an invite link for this developer. You'll need to share it manually.
              </Typography>
              <TextField fullWidth size="small" required type="email" label="Email"
                value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </>
          ) : (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Invite generated for <strong>{inviteResult.email}</strong>.
                {inviteResult.expiresAt && ` Expires ${new Date(inviteResult.expiresAt).toLocaleDateString()}.`}
              </Alert>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Email integration is not yet supported — please share this link manually.
              </Typography>
              <TextField fullWidth size="small" value={inviteResult.inviteUrl}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button size="small" startIcon={<ContentCopy />} onClick={copyInvite}>
                        {copyOk ? 'Copied' : 'Copy'}
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setOpenInvite(false); setInviteResult(null); }} disabled={inviteBusy}>
            Close
          </Button>
          {!inviteResult && (
            <Button variant="contained" onClick={submitInvite} disabled={inviteBusy}>
              {inviteBusy ? 'Generating…' : 'Generate Invite'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExternalDevelopersListPage;

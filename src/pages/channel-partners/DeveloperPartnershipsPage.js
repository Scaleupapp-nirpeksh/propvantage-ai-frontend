import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Avatar, Chip, Alert, CircularProgress,
  Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Divider, InputAdornment, Pagination, FormControl, InputLabel, Select,
  OutlinedInput, ListItemText, Checkbox,
} from '@mui/material';
import { Search, PersonAdd, ContentCopy } from '@mui/icons-material';
import { marketplaceAPI, partnershipAPI, projectAPI } from '../../services/api';

const STATUS_META = {
  pending: { label: 'Pending', color: 'warning' },
  active: { label: 'Active', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
  suspended: { label: 'Suspended', color: 'warning' },
  terminated: { label: 'Terminated', color: 'default' },
  declined: { label: 'Declined', color: 'default' },
};

const CP_STATUS_CHIP = {
  none: { label: 'Not connected', color: 'default' },
  pending: { label: 'Application pending', color: 'warning' },
  active: { label: 'Active partner', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
  suspended: { label: 'Suspended', color: 'warning' },
  terminated: { label: 'Terminated', color: 'default' },
};

const PAGE_LIMIT = 12;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtCommission = (c) => {
  if (!c) return null;
  return c.type === 'percentage' ? `${c.value}% commission` : `₹${c.value} flat commission`;
};

// Empty commission terms form.
const emptyTerms = { type: 'percentage', value: '', notes: '' };

const StatusChip = ({ status }) => {
  const meta = STATUS_META[status] || { label: status, color: 'default' };
  return <Chip size="small" label={meta.label} color={meta.color} />;
};

const ProjectMultiSelect = ({ projects, value, onChange, disabled }) => (
  <FormControl fullWidth size="small" disabled={disabled || projects.length === 0}>
    <InputLabel id="proj-select-label">Restrict to projects (optional)</InputLabel>
    <Select
      labelId="proj-select-label"
      multiple
      value={value}
      onChange={(e) => onChange(e.target.value)}
      input={<OutlinedInput label="Restrict to projects (optional)" />}
      renderValue={(selected) =>
        selected.length === 0
          ? 'All projects'
          : projects.filter((p) => selected.includes(p._id)).map((p) => p.name).join(', ')}
    >
      {projects.map((p) => (
        <MenuItem key={p._id} value={p._id}>
          <Checkbox checked={value.includes(p._id)} />
          <ListItemText primary={p.name} />
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const CommissionFields = ({ terms, onChange, disabled }) => (
  <Grid container spacing={2}>
    <Grid item xs={6}>
      <TextField fullWidth size="small" select label="Commission type" value={terms.type}
        onChange={(e) => onChange({ ...terms, type: e.target.value })} disabled={disabled}>
        <MenuItem value="percentage">Percentage</MenuItem>
        <MenuItem value="flat">Flat amount</MenuItem>
      </TextField>
    </Grid>
    <Grid item xs={6}>
      <TextField fullWidth size="small" type="number"
        label={terms.type === 'percentage' ? 'Value (%)' : 'Value (₹)'}
        value={terms.value} onChange={(e) => onChange({ ...terms, value: e.target.value })}
        disabled={disabled} />
    </Grid>
    <Grid item xs={12}>
      <TextField fullWidth size="small" multiline minRows={2} label="Notes (optional)"
        value={terms.notes} onChange={(e) => onChange({ ...terms, notes: e.target.value })}
        disabled={disabled} />
    </Grid>
  </Grid>
);

const DeveloperPartnershipsPage = () => {
  const [tab, setTab] = useState(0);

  // Partnerships
  const [partnerships, setPartnerships] = useState([]);
  const [loadingP, setLoadingP] = useState(true);
  const [errorP, setErrorP] = useState('');

  // Projects (for multi-select)
  const [projects, setProjects] = useState([]);

  // Marketplace (Find Partners tab)
  const [cpFilters, setCpFilters] = useState({ q: '', category: '', area: '' });
  const [cpPage, setCpPage] = useState(1);
  const [cpData, setCpData] = useState({ channelPartners: [], total: 0 });
  const [loadingCp, setLoadingCp] = useState(false);
  const [errorCp, setErrorCp] = useState('');

  // Shared action feedback
  const [actionOk, setActionOk] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Approve dialog
  const [approveTarget, setApproveTarget] = useState(null); // partnership
  const [approveTerms, setApproveTerms] = useState(emptyTerms);
  const [approveProjects, setApproveProjects] = useState([]);
  const [approveBusy, setApproveBusy] = useState(false);
  const [approveError, setApproveError] = useState('');

  // Invite dialog
  const [inviteTarget, setInviteTarget] = useState(null); // CP card
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteTerms, setInviteTerms] = useState(emptyTerms);
  const [inviteProjects, setInviteProjects] = useState([]);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Off-platform "invite a new channel partner" dialog
  const [newCpOpen, setNewCpOpen] = useState(false);
  const [newCpForm, setNewCpForm] = useState({ firmName: '', email: '', category: '' });
  const [newCpTerms, setNewCpTerms] = useState(emptyTerms);
  const [newCpProjects, setNewCpProjects] = useState([]);
  const [newCpBusy, setNewCpBusy] = useState(false);
  const [newCpError, setNewCpError] = useState('');
  const [newCpResult, setNewCpResult] = useState(null); // { firmName, inviteLink }
  const [copyOk, setCopyOk] = useState(false);

  const loadPartnerships = useCallback(() => {
    setLoadingP(true);
    setErrorP('');
    partnershipAPI.list()
      .then((res) => setPartnerships(res.data?.data || []))
      .catch(() => setErrorP('Could not load partnerships.'))
      .finally(() => setLoadingP(false));
  }, []);

  useEffect(() => { loadPartnerships(); }, [loadPartnerships]);

  useEffect(() => {
    projectAPI.getProjects()
      .then((res) => {
        const d = res.data?.data;
        const list = Array.isArray(d) ? d : (d?.projects || res.data?.projects || []);
        setProjects((list || []).map((p) => ({ _id: p._id, name: p.name })));
      })
      .catch(() => setProjects([]));
  }, []);

  const loadMarketplace = useCallback(() => {
    setLoadingCp(true);
    setErrorCp('');
    const params = { page: cpPage, limit: PAGE_LIMIT };
    Object.entries(cpFilters).forEach(([k, v]) => {
      if (v !== '' && v != null) params[k] = v;
    });
    marketplaceAPI.browseChannelPartners(params)
      .then((res) => {
        const d = res.data?.data || {};
        setCpData({ channelPartners: d.channelPartners || [], total: d.total || 0 });
      })
      .catch(() => setErrorCp('Could not load the channel-partner marketplace.'))
      .finally(() => setLoadingCp(false));
  }, [cpFilters, cpPage]);

  useEffect(() => {
    if (tab === 3) loadMarketplace();
  }, [tab, loadMarketplace]);

  // ── Partnership transitions ──
  const transition = async (id, action) => {
    setBusyId(id);
    setActionOk('');
    setActionError('');
    try {
      await partnershipAPI.transition(id, { action });
      setActionOk('Partnership updated.');
      loadPartnerships();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not complete that action.');
    } finally {
      setBusyId(null);
    }
  };

  const openApprove = (p) => {
    setApproveTarget(p);
    setApproveTerms(emptyTerms);
    setApproveProjects([]);
    setApproveError('');
  };

  const submitApprove = async () => {
    if (!approveTarget) return;
    const value = Number(approveTerms.value);
    if (!approveTerms.value || Number.isNaN(value) || value <= 0) {
      setApproveError('Enter a valid commission value.');
      return;
    }
    setApproveBusy(true);
    setApproveError('');
    try {
      const payload = {
        action: 'approve',
        commissionTerms: {
          type: approveTerms.type,
          value,
          ...(approveTerms.notes ? { notes: approveTerms.notes } : {}),
        },
      };
      if (approveProjects.length > 0) payload.projects = approveProjects;
      await partnershipAPI.transition(approveTarget._id, payload);
      setApproveTarget(null);
      setActionOk('Application approved.');
      loadPartnerships();
    } catch (err) {
      setApproveError(err.response?.data?.message || 'Could not approve this application.');
    } finally {
      setApproveBusy(false);
    }
  };

  const openInvite = (cp) => {
    setInviteTarget(cp);
    setInviteMessage('');
    setInviteTerms(emptyTerms);
    setInviteProjects([]);
    setInviteError('');
  };

  const submitInvite = async () => {
    if (!inviteTarget) return;
    const value = Number(inviteTerms.value);
    if (!inviteTerms.value || Number.isNaN(value) || value <= 0) {
      setInviteError('Enter a valid commission value.');
      return;
    }
    setInviteBusy(true);
    setInviteError('');
    try {
      const payload = {
        counterpartyOrgId: inviteTarget.organizationId,
        message: inviteMessage,
        commissionTerms: {
          type: inviteTerms.type,
          value,
          ...(inviteTerms.notes ? { notes: inviteTerms.notes } : {}),
        },
      };
      if (inviteProjects.length > 0) payload.projects = inviteProjects;
      await partnershipAPI.create(payload);
      setInviteTarget(null);
      setActionOk('Invitation sent.');
      setCpData((d) => ({
        ...d,
        channelPartners: d.channelPartners.map((x) =>
          x.organizationId === inviteTarget.organizationId
            ? { ...x, partnershipStatus: 'pending' } : x),
      }));
      loadPartnerships();
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Could not send the invitation.');
    } finally {
      setInviteBusy(false);
    }
  };

  const openNewCp = () => {
    setNewCpForm({ firmName: '', email: '', category: '' });
    setNewCpTerms(emptyTerms);
    setNewCpProjects([]);
    setNewCpError('');
    setNewCpResult(null);
    setCopyOk(false);
    setNewCpOpen(true);
  };

  const closeNewCp = () => {
    if (newCpBusy) return;
    setNewCpOpen(false);
  };

  const submitNewCp = async () => {
    const firmName = newCpForm.firmName.trim();
    const email = newCpForm.email.trim();
    if (!firmName) { setNewCpError('Enter the firm name.'); return; }
    if (!email) { setNewCpError('Enter a contact email.'); return; }
    if (!newCpForm.category) { setNewCpError('Choose a category.'); return; }
    const value = Number(newCpTerms.value);
    if (!newCpTerms.value || Number.isNaN(value) || value <= 0) {
      setNewCpError('Enter a valid commission value.');
      return;
    }
    setNewCpBusy(true);
    setNewCpError('');
    try {
      const payload = {
        firmName,
        email,
        category: newCpForm.category,
        commissionTerms: {
          type: newCpTerms.type,
          value,
          ...(newCpTerms.notes ? { notes: newCpTerms.notes } : {}),
        },
      };
      if (newCpProjects.length > 0) payload.projects = newCpProjects;
      const res = await partnershipAPI.inviteNewCp(payload);
      const data = res.data?.data || {};
      setNewCpResult({ firmName: data.firmName || firmName, inviteLink: data.inviteLink || '' });
      loadPartnerships();
    } catch (err) {
      setNewCpError(err.response?.data?.message || 'Could not create the invite.');
    } finally {
      setNewCpBusy(false);
    }
  };

  const copyInviteLink = async () => {
    if (!newCpResult?.inviteLink) return;
    try {
      await navigator.clipboard.writeText(newCpResult.inviteLink);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 2000);
    } catch {
      setCopyOk(false);
    }
  };

  // ── Derived lists ──
  const requests = partnerships.filter(
    (p) => p.status === 'pending' && p.initiatedBy === 'channel_partner');
  const activePartners = partnerships.filter(
    (p) => p.status === 'active' || p.status === 'suspended');
  const invitesSent = partnerships.filter((p) => p.initiatedBy === 'developer');

  const setCpFilter = (k) => (e) => {
    setCpFilters((f) => ({ ...f, [k]: e.target.value }));
    setCpPage(1);
  };
  const cpTotalPages = Math.max(1, Math.ceil(cpData.total / PAGE_LIMIT));

  const renderPartnerCard = (p, actions) => {
    const cp = p.channelPartnerOrg || {};
    const commission = fmtCommission(p.commissionTerms);
    const busy = busyId === p._id;
    return (
      <Grid item xs={12} md={6} key={p._id}>
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Avatar src={cp.channelPartnerProfile?.logoUrl || undefined} sx={{ width: 48, height: 48 }}>
                {cp.name?.[0]}
              </Avatar>
              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                  {cp.name || 'Channel Partner'}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {[cp.category, cp.city].filter(Boolean).join(' · ') || '—'}
                </Typography>
              </Box>
              <StatusChip status={p.status} />
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary" display="block">
              {p.initiatedBy === 'developer' ? 'You invited' : 'They applied'}
              {' · Requested '}{fmtDate(p.requestedAt || p.createdAt)}
            </Typography>
            {p.decidedAt && (
              <Typography variant="caption" color="text.secondary" display="block">
                Decided {fmtDate(p.decidedAt)}
              </Typography>
            )}
            {p.application?.message && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                “{p.application.message}”
              </Typography>
            )}
            {commission && (
              <Chip size="small" variant="outlined" label={commission} sx={{ mt: 1 }} />
            )}
            {actions && (
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                {actions(p, busy)}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Partnerships</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Review applications, manage active channel partners, and invite new ones.
      </Typography>

      {actionOk && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionOk('')}>{actionOk}</Alert>}
      {actionError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>{actionError}</Alert>}

      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}
        variant="scrollable" scrollButtons="auto">
        <Tab label={`Requests${requests.length ? ` (${requests.length})` : ''}`} />
        <Tab label="Active Partners" />
        <Tab label="Invites Sent" />
        <Tab label="Find Partners" />
      </Tabs>

      {/* Tab 0-2: partnership lists */}
      {tab <= 2 && (
        loadingP ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : errorP ? (
          <Alert severity="error">{errorP}</Alert>
        ) : (
          <>
            {tab === 0 && (requests.length === 0 ? (
              <Alert severity="info">No incoming partnership requests.</Alert>
            ) : (
              <Grid container spacing={2}>
                {requests.map((p) => renderPartnerCard(p, (item, busy) => (
                  <>
                    <Button size="small" variant="contained" disabled={busy}
                      onClick={() => openApprove(item)}>Approve</Button>
                    <Button size="small" color="error" disabled={busy}
                      onClick={() => transition(item._id, 'reject')}>Reject</Button>
                  </>
                )))}
              </Grid>
            ))}

            {tab === 1 && (activePartners.length === 0 ? (
              <Alert severity="info">No active channel partners yet.</Alert>
            ) : (
              <Grid container spacing={2}>
                {activePartners.map((p) => renderPartnerCard(p, (item, busy) => (
                  <>
                    {item.status === 'active' && (
                      <Button size="small" disabled={busy}
                        onClick={() => transition(item._id, 'suspend')}>Suspend</Button>
                    )}
                    {item.status === 'suspended' && (
                      <Button size="small" variant="contained" disabled={busy}
                        onClick={() => transition(item._id, 'resume')}>Resume</Button>
                    )}
                    <Button size="small" color="error" disabled={busy}
                      onClick={() => transition(item._id, 'terminate')}>Terminate</Button>
                  </>
                )))}
              </Grid>
            ))}

            {tab === 2 && (invitesSent.length === 0 ? (
              <Alert severity="info">You have not sent any invitations yet.</Alert>
            ) : (
              <Grid container spacing={2}>
                {invitesSent.map((p) => renderPartnerCard(p, null))}
              </Grid>
            ))}
          </>
        )
      )}

      {/* Tab 3: Find Partners */}
      {tab === 3 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<PersonAdd />} onClick={openNewCp}>
              Invite a new channel partner
            </Button>
          </Box>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth size="small" label="Search channel partners"
                    value={cpFilters.q} onChange={setCpFilter('q')}
                    InputProps={{ startAdornment: (
                      <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                    ) }} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth size="small" select label="Category"
                    value={cpFilters.category} onChange={setCpFilter('category')}>
                    <MenuItem value="">Any</MenuItem>
                    <MenuItem value="individual_agent">Individual Agent</MenuItem>
                    <MenuItem value="broker_firm">Broker Firm</MenuItem>
                    <MenuItem value="corporate">Corporate</MenuItem>
                    <MenuItem value="digital_aggregator">Digital Aggregator</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField fullWidth size="small" label="Area" value={cpFilters.area}
                    onChange={setCpFilter('area')} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {loadingCp ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : errorCp ? (
            <Alert severity="error">{errorCp}</Alert>
          ) : cpData.channelPartners.length === 0 ? (
            <Alert severity="info">No channel partners match your search.</Alert>
          ) : (
            <>
              <Grid container spacing={2}>
                {cpData.channelPartners.map((cp) => {
                  const cfg = CP_STATUS_CHIP[cp.partnershipStatus] || CP_STATUS_CHIP.none;
                  return (
                    <Grid item xs={12} sm={6} md={4} key={cp.organizationId}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                            <Avatar src={cp.logoUrl || undefined} sx={{ width: 48, height: 48 }}>
                              {cp.name?.[0]}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                                {cp.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {[cp.category, cp.city].filter(Boolean).join(' · ') || '—'}
                              </Typography>
                            </Box>
                          </Box>
                          {cp.about && (
                            <Typography variant="body2" color="text.secondary" sx={{
                              mb: 1, display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                              {cp.about}
                            </Typography>
                          )}
                          {(cp.areasServed || []).length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                              {cp.areasServed.slice(0, 4).map((a) => (
                                <Chip key={a} size="small" variant="outlined" label={a} />
                              ))}
                            </Box>
                          )}
                          {cp.trackRecord && (
                            <Typography variant="caption" color="text.secondary"
                              sx={{ display: 'block', mb: 1 }}>
                              {cp.trackRecord}
                            </Typography>
                          )}
                          <Chip size="small" label={cfg.label} color={cfg.color} />
                          {['none', 'rejected', 'terminated'].includes(cp.partnershipStatus) && (
                            <Box sx={{ mt: 1.5 }}>
                              <Button size="small" variant="contained"
                                onClick={() => openInvite(cp)}>
                                {cp.partnershipStatus === 'none' ? 'Invite' : 'Re-invite'}
                              </Button>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
              {cpTotalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination count={cpTotalPages} page={cpPage}
                    onChange={(e, v) => setCpPage(v)} />
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* Approve dialog */}
      <Dialog open={!!approveTarget} onClose={() => !approveBusy && setApproveTarget(null)}
        maxWidth="sm" fullWidth>
        <DialogTitle>
          Approve {approveTarget?.channelPartnerOrg?.name || 'application'}
        </DialogTitle>
        <DialogContent dividers>
          {approveError && <Alert severity="error" sx={{ mb: 2 }}>{approveError}</Alert>}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Commission terms</Typography>
          <CommissionFields terms={approveTerms} onChange={setApproveTerms} disabled={approveBusy} />
          <Box sx={{ mt: 2 }}>
            <ProjectMultiSelect projects={projects} value={approveProjects}
              onChange={setApproveProjects} disabled={approveBusy} />
            <Typography variant="caption" color="text.secondary">
              Leave empty to allow the partner to work across all projects.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setApproveTarget(null)} disabled={approveBusy}>Cancel</Button>
          <Button variant="contained" onClick={submitApprove} disabled={approveBusy}>
            {approveBusy ? 'Approving…' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite dialog */}
      <Dialog open={!!inviteTarget} onClose={() => !inviteBusy && setInviteTarget(null)}
        maxWidth="sm" fullWidth>
        <DialogTitle>Invite {inviteTarget?.name}</DialogTitle>
        <DialogContent dividers>
          {inviteError && <Alert severity="error" sx={{ mb: 2 }}>{inviteError}</Alert>}
          <TextField fullWidth multiline minRows={3} label="Message to the channel partner"
            value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)}
            disabled={inviteBusy} sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Commission terms</Typography>
          <CommissionFields terms={inviteTerms} onChange={setInviteTerms} disabled={inviteBusy} />
          <Box sx={{ mt: 2 }}>
            <ProjectMultiSelect projects={projects} value={inviteProjects}
              onChange={setInviteProjects} disabled={inviteBusy} />
            <Typography variant="caption" color="text.secondary">
              Leave empty to allow the partner to work across all projects.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setInviteTarget(null)} disabled={inviteBusy}>Cancel</Button>
          <Button variant="contained" onClick={submitInvite} disabled={inviteBusy}>
            {inviteBusy ? 'Sending…' : 'Send invitation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite a new (off-platform) channel partner dialog */}
      <Dialog open={newCpOpen} onClose={closeNewCp} maxWidth="sm" fullWidth>
        <DialogTitle>Invite a new channel partner</DialogTitle>
        <DialogContent dividers>
          {newCpResult ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                Invite created for {newCpResult.firmName}.
              </Alert>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Share this link with the channel partner so they can register and join
                you on PropVantage:
              </Typography>
              <TextField
                fullWidth
                size="small"
                label="Invite link"
                value={newCpResult.inviteLink}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button size="small" startIcon={<ContentCopy />} onClick={copyInviteLink}>
                        {copyOk ? 'Copied' : 'Copy'}
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                This channel partner record is now trackable under “All Partners”.
              </Typography>
            </>
          ) : (
            <>
              {newCpError && <Alert severity="error" sx={{ mb: 2 }}>{newCpError}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Firm name"
                    value={newCpForm.firmName}
                    onChange={(e) => setNewCpForm((f) => ({ ...f, firmName: e.target.value }))}
                    disabled={newCpBusy} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" type="email" label="Contact email"
                    value={newCpForm.email}
                    onChange={(e) => setNewCpForm((f) => ({ ...f, email: e.target.value }))}
                    disabled={newCpBusy} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" select label="Category"
                    value={newCpForm.category}
                    onChange={(e) => setNewCpForm((f) => ({ ...f, category: e.target.value }))}
                    disabled={newCpBusy}>
                    <MenuItem value="individual_agent">Individual Agent</MenuItem>
                    <MenuItem value="broker_firm">Broker Firm</MenuItem>
                    <MenuItem value="corporate">Corporate</MenuItem>
                    <MenuItem value="digital_aggregator">Digital Aggregator</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Commission terms</Typography>
              <CommissionFields terms={newCpTerms} onChange={setNewCpTerms} disabled={newCpBusy} />
              <Box sx={{ mt: 2 }}>
                <ProjectMultiSelect projects={projects} value={newCpProjects}
                  onChange={setNewCpProjects} disabled={newCpBusy} />
                <Typography variant="caption" color="text.secondary">
                  Leave empty to allow the partner to work across all projects.
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeNewCp} disabled={newCpBusy}>
            {newCpResult ? 'Close' : 'Cancel'}
          </Button>
          {!newCpResult && (
            <Button variant="contained" onClick={submitNewCp} disabled={newCpBusy}>
              {newCpBusy ? 'Creating…' : 'Create invite'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeveloperPartnershipsPage;

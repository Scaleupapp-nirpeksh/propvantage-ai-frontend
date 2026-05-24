// File: src/pages/cp-portal/ProspectsListPage.js
// SP4 — CP-side prospects list with filter bar + create dialog.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, FormControl,
  InputLabel, Select, RadioGroup, FormControlLabel, Radio, Divider, Stack,
  IconButton, Tooltip,
} from '@mui/material';
import { Add, Refresh, Search } from '@mui/icons-material';
import {
  cpProspectsAPI, cpExternalDevelopersAPI, cpPortalAPI, partnershipAPI, portfolioAPI,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PROSPECT_STATUSES = [
  'New', 'Contacted', 'Site Visit Scheduled', 'Site Visit Done',
  'Negotiation', 'Booked', 'Lost', 'On Hold',
];

const PRIORITIES = ['Low', 'Medium', 'High'];

const STATUS_COLOR = {
  New: 'default',
  Contacted: 'info',
  'Site Visit Scheduled': 'info',
  'Site Visit Done': 'primary',
  Negotiation: 'warning',
  Booked: 'success',
  Lost: 'error',
  'On Hold': 'default',
};

const fmtRelative = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return date.toLocaleDateString();
};

const isCpManagerOrOwner = (user, isOwner) => {
  if (isOwner) return true;
  const role = user?.role || '';
  return role === 'Channel Partner Manager' || role === 'Business Head';
};

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  contextType: 'platform', // 'platform' | 'external'
  partnership: '',
  platformProject: '',
  externalDeveloper: '',
  externalProjectName: '',
  externalProjectLocation: '',
  externalProjectType: '',
  assignedAgent: '',
  priority: 'Medium',
  budgetMin: '',
  budgetMax: '',
  budgetCurrency: 'INR',
  // SP4+ — structured requirements (mirrors Lead.requirements on dev side).
  reqTimeline: '',
  reqUnitType: '',
  reqFloorPreference: 'any',
  reqFacing: 'Any',
  reqAmenities: '', // comma-separated in the form; split on submit
  reqSpecialRequirements: '',
  notes: '',
  creationNote: '',
};

const TIMELINE_OPTIONS = [
  { value: '', label: '—' },
  { value: 'immediate', label: 'Immediate' },
  { value: '1-3_months', label: '1–3 months' },
  { value: '3-6_months', label: '3–6 months' },
  { value: '6-12_months', label: '6–12 months' },
  { value: '12+_months', label: '12+ months' },
];
const FLOOR_PREF_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];
const FACING_OPTIONS = [
  'Any', 'North', 'South', 'East', 'West',
  'North-East', 'North-West', 'South-East', 'South-West',
];

const ProspectsListPage = () => {
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();
  const canPickAgent = isCpManagerOrOwner(user, isOwner);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterStatus, setFilterStatus] = useState([]); // array
  const [filterAgent, setFilterAgent] = useState('');
  const [filterContext, setFilterContext] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  // Team for agent picker
  const [team, setTeam] = useState([]);

  // Create dialog
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Reference data for the dialog
  const [activePartnerships, setActivePartnerships] = useState([]);
  const [externalDevelopers, setExternalDevelopers] = useState([]);
  const [projectsForPartnership, setProjectsForPartnership] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [refsLoaded, setRefsLoaded] = useState(false);

  // Quick-create external developer sub-dialog
  const [openQuickExt, setOpenQuickExt] = useState(false);
  const [quickExtName, setQuickExtName] = useState('');
  const [quickExtCity, setQuickExtCity] = useState('');
  const [quickExtBusy, setQuickExtBusy] = useState(false);
  const [quickExtError, setQuickExtError] = useState('');

  const loadList = useCallback(() => {
    setLoading(true);
    setError('');
    const params = {};
    if (filterStatus.length === 1) params.status = filterStatus[0];
    if (filterAgent) params.assignedAgent = filterAgent;
    if (filterContext) params.developerContextType = filterContext;
    if (filterPriority) params.priority = filterPriority;
    if (filterSearch) params.search = filterSearch;
    cpProspectsAPI.list(params)
      .then((res) => {
        const data = res.data?.data || res.data || [];
        const list = Array.isArray(data) ? data : (data.items || []);
        // If multi-select status filter, apply client-side filter for remaining
        const filtered = filterStatus.length > 1
          ? list.filter((p) => filterStatus.includes(p.status))
          : list;
        setItems(filtered);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load prospects.'))
      .finally(() => setLoading(false));
  }, [filterStatus, filterAgent, filterContext, filterPriority, filterSearch]);

  useEffect(() => { loadList(); }, [loadList]);

  // Load team for filter + assigned-agent picker
  useEffect(() => {
    cpPortalAPI.getTeam()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        const list = Array.isArray(data) ? data : (data.members || data.team || []);
        setTeam(list);
      })
      .catch(() => setTeam([]));
  }, []);

  const loadRefs = useCallback(() => {
    setRefsLoaded(false);
    Promise.all([
      partnershipAPI.list({ status: 'active' }).catch(() => ({ data: { data: [] } })),
      cpExternalDevelopersAPI.list().catch(() => ({ data: { data: [] } })),
    ]).then(([pRes, eRes]) => {
      const partnerships = pRes.data?.data || pRes.data || [];
      const externals = eRes.data?.data || eRes.data || [];
      setActivePartnerships(Array.isArray(partnerships) ? partnerships.filter((p) => p.status === 'active') : []);
      setExternalDevelopers(Array.isArray(externals) ? externals : []);
      setRefsLoaded(true);
    });
  }, []);

  const openCreateDialog = () => {
    setForm({
      ...initialForm,
      assignedAgent: canPickAgent ? '' : (user?._id || ''),
    });
    setCreateError('');
    setProjectsForPartnership([]);
    setOpenCreate(true);
    if (!refsLoaded) loadRefs();
  };

  // When partnership changes, load that developer's projects
  useEffect(() => {
    if (!openCreate) return;
    if (form.contextType !== 'platform' || !form.partnership) {
      setProjectsForPartnership([]);
      return;
    }
    const partnership = activePartnerships.find((p) => p._id === form.partnership);
    const developerOrgId = partnership?.developerOrg?._id;
    if (!developerOrgId) {
      setProjectsForPartnership([]);
      return;
    }
    setLoadingProjects(true);
    portfolioAPI.getPortfolio(developerOrgId)
      .then((res) => {
        const portfolio = res.data?.data || res.data || {};
        setProjectsForPartnership(portfolio.projects || []);
      })
      .catch(() => setProjectsForPartnership([]))
      .finally(() => setLoadingProjects(false));
  }, [form.partnership, form.contextType, activePartnerships, openCreate]);

  const setField = (k) => (e) => {
    const v = e?.target?.value !== undefined ? e.target.value : e;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleQuickCreateExt = async () => {
    if (!quickExtName.trim()) {
      setQuickExtError('Name is required.');
      return;
    }
    setQuickExtBusy(true);
    setQuickExtError('');
    try {
      const res = await cpExternalDevelopersAPI.create({
        name: quickExtName.trim(),
        city: quickExtCity.trim() || undefined,
      });
      const created = res.data?.data || res.data;
      const newId = created?._id;
      // Refresh list and select the new one
      const listRes = await cpExternalDevelopersAPI.list();
      const list = listRes.data?.data || listRes.data || [];
      setExternalDevelopers(Array.isArray(list) ? list : []);
      if (newId) setForm((f) => ({ ...f, externalDeveloper: newId }));
      setOpenQuickExt(false);
      setQuickExtName('');
      setQuickExtCity('');
    } catch (err) {
      setQuickExtError(err.response?.data?.message || 'Could not create developer.');
    } finally {
      setQuickExtBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!form.firstName.trim() || !form.phone.trim()) {
      setCreateError('First name and phone are required.');
      return;
    }
    if (form.contextType === 'platform' && !form.partnership) {
      setCreateError('Please pick an active partnership.');
      return;
    }
    if (form.contextType === 'platform' && !form.platformProject) {
      setCreateError('Please pick a project from the developer.');
      return;
    }
    if (form.contextType === 'external' && !form.externalDeveloper) {
      setCreateError('Please pick an off-platform developer.');
      return;
    }
    if (form.contextType === 'external' && !form.externalProjectName.trim()) {
      setCreateError('Please enter a project name.');
      return;
    }
    const assignedAgent = canPickAgent ? form.assignedAgent : (user?._id || '');
    if (!assignedAgent) {
      setCreateError('Please pick an assigned agent.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim(),
        assignedAgent,
        priority: form.priority,
      };
      if (form.contextType === 'platform') {
        payload.developerContext = { type: 'platform', partnership: form.partnership };
        payload.project = { platform: form.platformProject };
      } else {
        payload.developerContext = { type: 'external', externalDeveloper: form.externalDeveloper };
        payload.project = {
          external: {
            name: form.externalProjectName.trim(),
            location: form.externalProjectLocation.trim() || undefined,
            type: form.externalProjectType.trim() || undefined,
          },
        };
      }
      if (form.budgetMin || form.budgetMax) {
        payload.budget = {
          min: form.budgetMin ? Number(form.budgetMin) : undefined,
          max: form.budgetMax ? Number(form.budgetMax) : undefined,
          currency: form.budgetCurrency || 'INR',
        };
      }
      // SP4+ — structured requirements (matches Lead.requirements on dev side).
      // Only include the object if at least one subfield is meaningfully set,
      // so we don't write defaults-only on empty submissions.
      const amenitiesList = form.reqAmenities
        .split(',').map((s) => s.trim()).filter(Boolean);
      const reqObj = {};
      if (form.reqTimeline) reqObj.timeline = form.reqTimeline;
      if (form.reqUnitType.trim()) reqObj.unitType = form.reqUnitType.trim();
      if (form.reqFloorPreference && form.reqFloorPreference !== 'any') {
        reqObj.floor = { preference: form.reqFloorPreference };
      }
      if (form.reqFacing && form.reqFacing !== 'Any') reqObj.facing = form.reqFacing;
      if (amenitiesList.length) reqObj.amenities = amenitiesList;
      if (form.reqSpecialRequirements.trim()) {
        reqObj.specialRequirements = form.reqSpecialRequirements.trim();
      }
      if (Object.keys(reqObj).length) payload.requirements = reqObj;

      if (form.notes.trim()) payload.notes = form.notes.trim();
      if (form.creationNote.trim()) payload.creationNote = form.creationNote.trim();

      const res = await cpProspectsAPI.create(payload);
      const created = res.data?.data || res.data;
      const newId = created?._id;
      setOpenCreate(false);
      if (newId) navigate(`/partner/prospects/${newId}`);
      else loadList();
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Could not create prospect.');
    } finally {
      setCreating(false);
    }
  };

  const renderDeveloperCell = (p) => {
    const type = p.developerContext?.type;
    let name = '—';
    if (type === 'platform') {
      name = p.developerContext?.partnership?.developerOrg?.name
        || p.developerContext?.partnership?.developerOrg
        || 'Platform Developer';
      if (typeof name === 'object') name = name?.name || 'Platform Developer';
    } else if (type === 'external') {
      const ext = p.developerContext?.externalDeveloper;
      name = (typeof ext === 'object' ? ext?.name : null) || 'External Developer';
    }
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <Chip size="small" label={type === 'platform' ? 'Platform' : 'External'}
          color={type === 'platform' ? 'primary' : 'default'} variant="outlined" />
        <Typography variant="body2" noWrap>{name}</Typography>
      </Stack>
    );
  };

  const renderProjectCell = (p) => {
    const plat = p.project?.platform;
    if (plat) {
      if (typeof plat === 'object') return plat.name || '—';
      return 'Platform project';
    }
    return p.project?.external?.name || '—';
  };

  const renderAgentCell = (p) => {
    const a = p.assignedAgent;
    if (!a) return '—';
    if (typeof a === 'object') return `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email || '—';
    return String(a);
  };

  const renderLastActivity = (p) => {
    const acts = p.activities || [];
    if (acts.length === 0) return '—';
    return fmtRelative(acts[acts.length - 1]?.at);
  };

  const renderFollowUp = (p) => {
    if (!p.nextFollowUp?.at) return '—';
    const date = new Date(p.nextFollowUp.at);
    return date.toLocaleDateString();
  };

  const teamForFilter = useMemo(() => team || [], [team]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Prospects</Typography>
          <Typography variant="body2" color="text.secondary">
            Your pipeline of buyer prospects — across on-platform and off-platform developers.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadList}><Refresh /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
            New Prospect
          </Button>
        </Stack>
      </Box>

      {/* Filter bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                multiple
                value={filterStatus}
                onChange={(e) => setFilterStatus(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                label="Status"
                renderValue={(sel) => sel.join(', ')}
              >
                {PROSPECT_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {canPickAgent && (
            <Grid item xs={12} sm={6} md={3}>
              <TextField select fullWidth size="small" label="Assigned Agent"
                value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {teamForFilter.map((m) => (
                  <MenuItem key={m._id} value={m._id}>
                    {`${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12} sm={6} md={2}>
            <TextField select fullWidth size="small" label="Context"
              value={filterContext} onChange={(e) => setFilterContext(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="platform">Platform</MenuItem>
              <MenuItem value="external">External</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField select fullWidth size="small" label="Priority"
              value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={canPickAgent ? 2 : 5}>
            <TextField fullWidth size="small" label="Search" placeholder="Name, phone…"
              value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)}
              InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
            />
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No prospects match your filters.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Developer</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell>Last Activity</TableCell>
                  <TableCell>Follow-up</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((p) => (
                  <TableRow
                    key={p._id}
                    hover
                    onClick={() => navigate(`/partner/prospects/${p._id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {`${p.firstName || ''} ${p.lastName || ''}`.trim() || '—'}
                      </Typography>
                      {p.email && (
                        <Typography variant="caption" color="text.secondary">{p.email}</Typography>
                      )}
                    </TableCell>
                    <TableCell>{p.phone || '—'}</TableCell>
                    <TableCell>{renderDeveloperCell(p)}</TableCell>
                    <TableCell>{renderProjectCell(p)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={p.status || 'New'} color={STATUS_COLOR[p.status] || 'default'} />
                    </TableCell>
                    <TableCell>{renderAgentCell(p)}</TableCell>
                    <TableCell>{renderLastActivity(p)}</TableCell>
                    <TableCell>{renderFollowUp(p)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create Prospect dialog */}
      <Dialog open={openCreate} onClose={() => !creating && setOpenCreate(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Prospect</DialogTitle>
        <DialogContent dividers>
          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}

          <Typography variant="overline" color="text.secondary">Contact</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" required label="First Name"
                value={form.firstName} onChange={setField('firstName')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Last Name"
                value={form.lastName} onChange={setField('lastName')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" type="email" label="Email"
                value={form.email} onChange={setField('email')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" required label="Phone"
                value={form.phone} onChange={setField('phone')} />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />
          <Typography variant="overline" color="text.secondary">Developer & Project</Typography>
          <RadioGroup row value={form.contextType} onChange={setField('contextType')} sx={{ mb: 1 }}>
            <FormControlLabel value="platform" control={<Radio />} label="On-platform partner" />
            <FormControlLabel value="external" control={<Radio />} label="Off-platform developer" />
          </RadioGroup>

          {form.contextType === 'platform' && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" required label="Active Partnership"
                  value={form.partnership} onChange={setField('partnership')}
                  disabled={!refsLoaded}>
                  {activePartnerships.length === 0 && (
                    <MenuItem value="" disabled>No active partnerships</MenuItem>
                  )}
                  {activePartnerships.map((p) => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.developerOrg?.name || 'Developer'}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" required label="Project"
                  value={form.platformProject} onChange={setField('platformProject')}
                  disabled={!form.partnership || loadingProjects}
                  helperText={loadingProjects ? 'Loading projects…' : ''}>
                  {projectsForPartnership.length === 0 && (
                    <MenuItem value="" disabled>No published projects</MenuItem>
                  )}
                  {projectsForPartnership.map((pr) => (
                    <MenuItem key={pr.id || pr._id} value={pr.id || pr._id}>
                      {pr.name}{pr.location ? ` — ${pr.location}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          )}

          {form.contextType === 'external' && (
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" required label="Off-Platform Developer"
                  value={form.externalDeveloper}
                  onChange={(e) => {
                    if (e.target.value === '__create__') setOpenQuickExt(true);
                    else setForm((f) => ({ ...f, externalDeveloper: e.target.value }));
                  }}
                  disabled={!refsLoaded}>
                  {externalDevelopers.map((d) => (
                    <MenuItem key={d._id} value={d._id}>
                      {d.name}{d.city ? ` — ${d.city}` : ''}
                    </MenuItem>
                  ))}
                  <MenuItem value="__create__">+ Create new developer</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" required label="Project Name"
                  value={form.externalProjectName} onChange={setField('externalProjectName')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Project Location"
                  value={form.externalProjectLocation} onChange={setField('externalProjectLocation')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Project Type"
                  placeholder="e.g. Residential, Commercial"
                  value={form.externalProjectType} onChange={setField('externalProjectType')} />
              </Grid>
            </Grid>
          )}

          <Divider sx={{ mb: 2 }} />
          <Typography variant="overline" color="text.secondary">Assignment & Details</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {canPickAgent ? (
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth size="small" required label="Assigned Agent"
                  value={form.assignedAgent} onChange={setField('assignedAgent')}>
                  {team.map((m) => (
                    <MenuItem key={m._id} value={m._id}>
                      {`${m.firstName || ''} ${m.lastName || ''}`.trim() || m.email}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            ) : (
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Assigned Agent"
                  value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || ''}
                  disabled helperText="Agents are auto-assigned to themselves" />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Priority"
                value={form.priority} onChange={setField('priority')}>
                {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" type="number" label="Budget Min"
                value={form.budgetMin} onChange={setField('budgetMin')} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" type="number" label="Budget Max"
                value={form.budgetMax} onChange={setField('budgetMax')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Budget Currency"
                value={form.budgetCurrency} onChange={setField('budgetCurrency')} />
            </Grid>
            {/* SP4+ — structured requirements (parity with dev-side Lead form). */}
            <Grid item xs={12}>
              <Typography variant="overline" color="text.secondary">Requirements</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Timeline"
                value={form.reqTimeline} onChange={setField('reqTimeline')}>
                {TIMELINE_OPTIONS.map((o) => (
                  <MenuItem key={o.value || 'none'} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Unit Type"
                placeholder="e.g. 2BHK, 3BHK, Villa"
                value={form.reqUnitType} onChange={setField('reqUnitType')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Floor Preference"
                value={form.reqFloorPreference} onChange={setField('reqFloorPreference')}>
                {FLOOR_PREF_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size="small" label="Facing"
                value={form.reqFacing} onChange={setField('reqFacing')}>
                {FACING_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Preferred Amenities"
                placeholder="Comma-separated, e.g. Gym, Pool, Clubhouse"
                value={form.reqAmenities} onChange={setField('reqAmenities')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline minRows={2}
                label="Special Requirements"
                placeholder="Anything else the customer specifically asked for"
                value={form.reqSpecialRequirements}
                onChange={setField('reqSpecialRequirements')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline minRows={2} label="Notes"
                value={form.notes} onChange={setField('notes')} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline minRows={2}
                label="Initial activity note (optional)"
                placeholder="Appended as the first activity"
                value={form.creationNote} onChange={setField('creationNote')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenCreate(false)} disabled={creating}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : 'Create Prospect'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick-create external developer */}
      <Dialog open={openQuickExt} onClose={() => !quickExtBusy && setOpenQuickExt(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Off-Platform Developer</DialogTitle>
        <DialogContent dividers>
          {quickExtError && <Alert severity="error" sx={{ mb: 2 }}>{quickExtError}</Alert>}
          <TextField fullWidth size="small" required label="Name" sx={{ mb: 2 }}
            value={quickExtName} onChange={(e) => setQuickExtName(e.target.value)} />
          <TextField fullWidth size="small" label="City"
            value={quickExtCity} onChange={(e) => setQuickExtCity(e.target.value)} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            You can fill in full contact and projects later from Off-Platform Developers.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenQuickExt(false)} disabled={quickExtBusy}>Cancel</Button>
          <Button variant="contained" onClick={handleQuickCreateExt} disabled={quickExtBusy}>
            {quickExtBusy ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProspectsListPage;

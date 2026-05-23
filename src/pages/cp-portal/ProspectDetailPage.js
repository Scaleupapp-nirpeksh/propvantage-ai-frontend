// File: src/pages/cp-portal/ProspectDetailPage.js
// SP4 — Prospect detail with Overview / Activities / Status & Push / Commission tabs.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Tabs, Tab, Card, CardContent, Chip, Stack,
  Grid, Divider, CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, RadioGroup, FormControlLabel, Radio,
  Table, TableBody, TableCell, TableHead, TableRow, IconButton, Tooltip,
} from '@mui/material';
import {
  ArrowBack, Refresh, Add, Send, Edit, Cancel, MoneyOff,
} from '@mui/icons-material';
import { cpProspectsAPI, leadAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PROSPECT_STATUSES = [
  'New', 'Contacted', 'Site Visit Scheduled', 'Site Visit Done',
  'Negotiation', 'Booked', 'Lost', 'On Hold',
];

const ACTIVITY_TYPES = [
  { value: 'call', label: 'Call' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'note', label: 'Note' },
  { value: 'follow_up_scheduled', label: 'Follow-up scheduled' },
];

const FOLLOW_UP_TYPES = ['call', 'site_visit', 'meeting', 'other'];

const PAYMENT_METHODS = ['bank_transfer', 'cheque', 'cash', 'upi', 'other'];

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

const COMMISSION_COLOR = {
  pending: 'default',
  partially_paid: 'warning',
  paid: 'success',
  written_off: 'error',
};

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : '—');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const fmtMoney = (n, ccy = 'INR') =>
  (n === undefined || n === null || n === '') ? '—' : `${ccy} ${Number(n).toLocaleString()}`;

const isCpManagerOrOwner = (user, isOwner) => {
  if (isOwner) return true;
  const role = user?.role || '';
  return role === 'Channel Partner Manager' || role === 'Business Head';
};

const ProspectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();
  const canWriteOff = isCpManagerOrOwner(user, isOwner);

  const [prospect, setProspect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState({ ok: '', err: '' });

  // Lead detail (for proposed-status visibility when pushed)
  const [pushedLead, setPushedLead] = useState(null);

  // Dialog state
  const [openActivity, setOpenActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({
    type: 'note', note: '', followUpDate: '', followUpType: 'call',
  });
  const [activityBusy, setActivityBusy] = useState(false);

  const [openStatus, setOpenStatus] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });
  const [statusBusy, setStatusBusy] = useState(false);

  const [openExternalStatus, setOpenExternalStatus] = useState(false);
  const [externalStatusVal, setExternalStatusVal] = useState('');
  const [externalStatusBusy, setExternalStatusBusy] = useState(false);

  const [pushBusy, setPushBusy] = useState(false);
  const [withdrawBusy, setWithdrawBusy] = useState(false);

  const [openBooking, setOpenBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    bookedAt: '', unitInfo: '', salePrice: '', currency: 'INR', notes: '',
  });
  const [bookingBusy, setBookingBusy] = useState(false);

  const [openPayment, setOpenPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '', receivedAt: '', method: 'bank_transfer', referenceNumber: '', notes: '',
  });
  const [paymentBusy, setPaymentBusy] = useState(false);

  const [openCommission, setOpenCommission] = useState(false);
  const [commissionForm, setCommissionForm] = useState({
    type: 'percentage', value: '', currency: 'INR', notes: '',
  });
  const [commissionBusy, setCommissionBusy] = useState(false);

  const [openWriteOff, setOpenWriteOff] = useState(false);
  const [writeOffReason, setWriteOffReason] = useState('');
  const [writeOffBusy, setWriteOffBusy] = useState(false);

  const loadProspect = useCallback(() => {
    setLoading(true);
    setError('');
    cpProspectsAPI.get(id)
      .then((res) => {
        const data = res.data?.data || res.data;
        setProspect(data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load prospect.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { loadProspect(); }, [loadProspect]);

  // Lazy-fetch the pushed Lead when we have one (to see proposedStatusChange)
  useEffect(() => {
    const leadId = prospect?.pushedToLead?._id || prospect?.pushedToLead;
    if (!leadId || typeof leadId !== 'string') {
      setPushedLead(null);
      return;
    }
    leadAPI.getLead(leadId)
      .then((res) => {
        const data = res.data?.data || res.data;
        setPushedLead(data);
      })
      .catch(() => setPushedLead(null));
  }, [prospect?.pushedToLead]);

  const showOk = (msg) => { setSnack({ ok: msg, err: '' }); };
  const showErr = (msg) => { setSnack({ ok: '', err: msg }); };

  // Pre-fill commission form when prospect loads
  useEffect(() => {
    if (prospect?.commissionAgreement) {
      setCommissionForm({
        type: prospect.commissionAgreement.type || 'percentage',
        value: prospect.commissionAgreement.value ?? '',
        currency: prospect.commissionAgreement.currency || 'INR',
        notes: prospect.commissionAgreement.notes || '',
      });
    }
  }, [prospect?.commissionAgreement]);

  // ────────────── Activity submit
  const submitActivity = async () => {
    if (!activityForm.note.trim()) { showErr('Note is required.'); return; }
    setActivityBusy(true);
    try {
      const payload = { type: activityForm.type, note: activityForm.note.trim() };
      if (activityForm.type === 'follow_up_scheduled') {
        if (!activityForm.followUpDate) {
          showErr('Follow-up date is required.');
          setActivityBusy(false);
          return;
        }
        payload.followUpDate = activityForm.followUpDate;
        payload.followUpType = activityForm.followUpType;
      }
      await cpProspectsAPI.addActivity(id, payload);
      setOpenActivity(false);
      setActivityForm({ type: 'note', note: '', followUpDate: '', followUpType: 'call' });
      showOk('Activity logged.');
      loadProspect();
    } catch (err) {
      showErr(err.response?.data?.message || 'Could not log activity.');
    } finally {
      setActivityBusy(false);
    }
  };

  // ────────────── External status update
  const submitExternalStatus = async () => {
    if (!externalStatusVal) { showErr('Pick a status.'); return; }
    setExternalStatusBusy(true);
    try {
      await cpProspectsAPI.update(id, { status: externalStatusVal });
      setOpenExternalStatus(false);
      setExternalStatusVal('');
      showOk('Status updated.');
      loadProspect();
    } catch (err) {
      showErr(err.response?.data?.message || 'Could not update status.');
    } finally {
      setExternalStatusBusy(false);
    }
  };

  // ────────────── Push to Developer
  const handlePush = async () => {
    if (!window.confirm('Push this prospect to the developer? They will receive a registration request.')) return;
    setPushBusy(true);
    try {
      await cpProspectsAPI.push(id);
      showOk('Prospect pushed to developer.');
      loadProspect();
    } catch (err) {
      showErr(err.response?.data?.message || 'Could not push prospect.');
    } finally {
      setPushBusy(false);
    }
  };

  // ────────────── Propose status change
  const submitProposeStatus = async () => {
    if (!statusForm.status) { showErr('Pick a status.'); return; }
    setStatusBusy(true);
    try {
      await cpProspectsAPI.proposeStatus(id, {
        status: statusForm.status,
        note: statusForm.note.trim() || undefined,
      });
      setOpenStatus(false);
      setStatusForm({ status: '', note: '' });
      showOk('Status change proposed.');
      loadProspect();
    } catch (err) {
      showErr(err.response?.data?.message || 'Could not propose status.');
    } finally {
      setStatusBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Withdraw the pending status proposal?')) return;
    setWithdrawBusy(true);
    try {
      await cpProspectsAPI.withdrawProposedStatus(id);
      showOk('Proposal withdrawn.');
      // Refresh lead state too
      const leadId = prospect?.pushedToLead?._id || prospect?.pushedToLead;
      if (leadId) {
        leadAPI.getLead(leadId).then((res) => setPushedLead(res.data?.data || res.data)).catch(() => {});
      }
      loadProspect();
    } catch (err) {
      showErr(err.response?.data?.message || 'Could not withdraw.');
    } finally {
      setWithdrawBusy(false);
    }
  };

  // ────────────── Booking submit
  const submitBooking = async () => {
    if (!bookingForm.bookedAt || !bookingForm.salePrice) {
      showErr('Booked-at date and sale price are required.');
      return;
    }
    setBookingBusy(true);
    try {
      await cpProspectsAPI.recordBooking(id, {
        bookedAt: bookingForm.bookedAt,
        unitInfo: bookingForm.unitInfo,
        salePrice: Number(bookingForm.salePrice),
        currency: bookingForm.currency || 'INR',
        notes: bookingForm.notes,
      });
      setOpenBooking(false);
      showOk('Booking recorded.');
      loadProspect();
    } catch (err) {
      showErr(err.response?.data?.message || 'Could not record booking.');
    } finally {
      setBookingBusy(false);
    }
  };

  // ────────────── Payment submit
  const submitPayment = async () => {
    if (!paymentForm.amount || !paymentForm.receivedAt) {
      showErr('Amount and date are required.');
      return;
    }
    setPaymentBusy(true);
    try {
      await cpProspectsAPI.addPayment(id, {
        amount: Number(paymentForm.amount),
        receivedAt: paymentForm.receivedAt,
        method: paymentForm.method,
        referenceNumber: paymentForm.referenceNumber || undefined,
        notes: paymentForm.notes || undefined,
      });
      setOpenPayment(false);
      setPaymentForm({ amount: '', receivedAt: '', method: 'bank_transfer', referenceNumber: '', notes: '' });
      showOk('Payment recorded.');
      loadProspect();
    } catch (err) {
      showErr(err.response?.data?.message || 'Could not record payment.');
    } finally {
      setPaymentBusy(false);
    }
  };

  // ────────────── Commission agreement
  const submitCommission = async () => {
    if (!commissionForm.value || Number(commissionForm.value) <= 0) {
      showErr('Enter a valid commission value.');
      return;
    }
    setCommissionBusy(true);
    try {
      await cpProspectsAPI.updateCommission(id, {
        commissionAgreement: {
          type: commissionForm.type,
          value: Number(commissionForm.value),
          currency: commissionForm.currency || 'INR',
          notes: commissionForm.notes || undefined,
        },
      });
      setOpenCommission(false);
      showOk('Commission agreement updated.');
      loadProspect();
    } catch (err) {
      showErr(err.response?.data?.message || 'Could not update commission.');
    } finally {
      setCommissionBusy(false);
    }
  };

  // ────────────── Write off
  const submitWriteOff = async () => {
    if (!writeOffReason.trim()) { showErr('Reason is required.'); return; }
    setWriteOffBusy(true);
    try {
      await cpProspectsAPI.updateCommission(id, {
        status: 'written_off',
        writeOffReason: writeOffReason.trim(),
      });
      setOpenWriteOff(false);
      setWriteOffReason('');
      showOk('Commission written off.');
      loadProspect();
    } catch (err) {
      showErr(err.response?.data?.message || 'Could not write off.');
    } finally {
      setWriteOffBusy(false);
    }
  };

  // ────────────── Derived
  const activities = useMemo(() => prospect?.activities || [], [prospect?.activities]);
  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => new Date(b.at) - new Date(a.at)),
    [activities],
  );
  const statusChanges = useMemo(
    () => activities.filter((a) => a.type === 'status_change'),
    [activities],
  );

  const payments = prospect?.commissionPayments || [];
  const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const expected = Number(prospect?.commissionExpectedAmount || 0);
  const balance = Math.max(0, expected - totalReceived);
  const commissionCcy =
    prospect?.commissionAgreement?.currency || prospect?.booking?.currency || 'INR';
  const commissionStatus = prospect?.commissionStatus || 'pending';

  const contextType = prospect?.developerContext?.type;
  const pushed = Boolean(prospect?.pushedToLead);
  const proposed = pushedLead?.proposedStatusChange || null;

  // ────────────── Render
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error || !prospect) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/partner/prospects')} sx={{ mb: 2 }}>
          Back to Prospects
        </Button>
        <Alert severity="error">{error || 'Prospect not found.'}</Alert>
      </Box>
    );
  }

  const developerLabel = (() => {
    if (contextType === 'platform') {
      return prospect.developerContext?.partnership?.developerOrg?.name
        || 'Platform Developer';
    }
    if (contextType === 'external') {
      return prospect.developerContext?.externalDeveloper?.name || 'External Developer';
    }
    return '—';
  })();

  const projectLabel = (() => {
    const plat = prospect.project?.platform;
    if (plat) return typeof plat === 'object' ? plat.name : 'Platform project';
    return prospect.project?.external?.name || '—';
  })();

  const agentLabel = (() => {
    const a = prospect.assignedAgent;
    if (!a) return '—';
    if (typeof a === 'object') return `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email || '—';
    return String(a);
  })();

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/partner/prospects')}><ArrowBack /></IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {`${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || 'Prospect'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {prospect.phone} {prospect.email ? `· ${prospect.email}` : ''}
          </Typography>
        </Box>
        <Tooltip title="Refresh"><IconButton onClick={loadProspect}><Refresh /></IconButton></Tooltip>
      </Box>

      {snack.ok && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSnack({ ok: '', err: '' })}>{snack.ok}</Alert>}
      {snack.err && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSnack({ ok: '', err: '' })}>{snack.err}</Alert>}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label={`Activities (${activities.length})`} />
          <Tab label="Status & Push" />
          <Tab label="Commission" />
        </Tabs>
      </Paper>

      {/* ── Tab 1: Overview ── */}
      {tab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="overline" color="text.secondary">Contact</Typography>
                <Typography variant="h6" sx={{ mt: 0.5 }}>
                  {`${prospect.firstName || ''} ${prospect.lastName || ''}`.trim() || '—'}
                </Typography>
                <Typography variant="body2">{prospect.phone || '—'}</Typography>
                {prospect.email && <Typography variant="body2" color="text.secondary">{prospect.email}</Typography>}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="overline" color="text.secondary">Developer Context</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <Chip size="small" label={contextType === 'platform' ? 'Platform' : 'External'}
                    color={contextType === 'platform' ? 'primary' : 'default'} />
                  <Typography variant="h6">{developerLabel}</Typography>
                </Stack>
                <Typography variant="body2" sx={{ mt: 1 }}>Project: {projectLabel}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="overline" color="text.secondary">Assignment</Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>Agent: {agentLabel}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip size="small" label={`Priority: ${prospect.priority || 'Medium'}`} />
                  <Chip size="small" label={prospect.status || 'New'} color={STATUS_COLOR[prospect.status] || 'default'} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="overline" color="text.secondary">Budget & Requirements</Typography>
                {prospect.budget && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Budget: {fmtMoney(prospect.budget.min, prospect.budget.currency || 'INR')}
                    {' – '}
                    {fmtMoney(prospect.budget.max, prospect.budget.currency || 'INR')}
                  </Typography>
                )}
                {prospect.requirements && (
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                    {prospect.requirements}
                  </Typography>
                )}
                {prospect.notes && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" color="text.secondary">Notes</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{prospect.notes}</Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="overline" color="text.secondary">Status Timeline</Typography>
                {statusChanges.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    No status changes yet.
                  </Typography>
                ) : (
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {statusChanges.map((s, idx) => (
                      <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip size="small" label={s.statusTo || s.status || '—'} />
                        <Typography variant="caption" color="text.secondary">
                          {fmtDateTime(s.at)}
                        </Typography>
                        {s.note && <Typography variant="body2">— {s.note}</Typography>}
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── Tab 2: Activities ── */}
      {tab === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setOpenActivity(true)}>
              Log Activity
            </Button>
          </Box>
          {sortedActivities.length === 0 ? (
            <Alert severity="info">No activities yet.</Alert>
          ) : (
            <Stack spacing={1.5}>
              {sortedActivities.map((a, idx) => (
                <Card key={idx} variant="outlined">
                  <CardContent sx={{ py: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip size="small" label={a.type || 'activity'} />
                      <Typography variant="caption" color="text.secondary">
                        {fmtDateTime(a.at)}
                      </Typography>
                    </Stack>
                    {a.note && (
                      <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                        {a.note}
                      </Typography>
                    )}
                    {a.followUpDate && (
                      <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                        Follow-up: {fmtDateTime(a.followUpDate)} ({a.followUpType || 'call'})
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* ── Tab 3: Status & Push ── */}
      {tab === 2 && (
        <Box>
          {contextType === 'external' && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">Off-platform pipeline</Typography>
                <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                  This prospect is tracked off-platform. You manage status directly.
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" startIcon={<Edit />} onClick={() => setOpenExternalStatus(true)}>
                    Update Status
                  </Button>
                  <Button variant="outlined" startIcon={<Send />}
                    onClick={() => navigate('/partner/external-developers')}>
                    Invite developer to platform
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {contextType === 'platform' && !pushed && (
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">Ready to push</Typography>
                <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                  Push this prospect to the developer to register it as a lead in their CRM.
                </Typography>
                <Button variant="contained" startIcon={<Send />} onClick={handlePush} disabled={pushBusy}>
                  {pushBusy ? 'Pushing…' : 'Push to Developer'}
                </Button>
              </CardContent>
            </Card>
          )}

          {contextType === 'platform' && pushed && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Pushed to{' '}
                <strong>
                  {prospect.developerContext?.partnership?.developerOrg?.name || 'Developer'}
                </strong>
                {' — Lead status: '}
                <strong>{pushedLead?.status || prospect.pushedToLead?.status || '—'}</strong>
                {prospect.pushedAt && ` · ${fmtDateTime(prospect.pushedAt)}`}
              </Alert>

              {proposed ? (
                <Alert severity="warning" sx={{ mb: 2 }}
                  action={
                    <Button color="inherit" size="small" startIcon={<Cancel />}
                      onClick={handleWithdraw} disabled={withdrawBusy}>
                      {withdrawBusy ? 'Withdrawing…' : 'Withdraw'}
                    </Button>
                  }
                >
                  Status change proposed: <strong>{proposed.status}</strong> — pending developer review.
                  {proposed.note && <Box sx={{ mt: 1 }}>Note: {proposed.note}</Box>}
                </Alert>
              ) : (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="overline" color="text.secondary">Propose status change</Typography>
                    <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                      Send a status-change proposal to the developer for review.
                    </Typography>
                    <Button variant="contained" startIcon={<Edit />} onClick={() => setOpenStatus(true)}>
                      Propose Status Change
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </Box>
      )}

      {/* ── Tab 4: Commission ── */}
      {tab === 3 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="overline" color="text.secondary">Commission Agreement</Typography>
                  <Button size="small" startIcon={<Edit />} onClick={() => setOpenCommission(true)}>
                    {prospect.commissionAgreement ? 'Edit' : 'Set'}
                  </Button>
                </Stack>
                {prospect.commissionAgreement ? (
                  <>
                    <Typography variant="body2">
                      Type: <strong>{prospect.commissionAgreement.type}</strong>
                    </Typography>
                    <Typography variant="body2">
                      Value: <strong>
                        {prospect.commissionAgreement.type === 'percentage'
                          ? `${prospect.commissionAgreement.value}%`
                          : fmtMoney(prospect.commissionAgreement.value, prospect.commissionAgreement.currency || 'INR')}
                      </strong>
                    </Typography>
                    {prospect.commissionAgreement.notes && (
                      <Typography variant="caption" color="text.secondary">
                        {prospect.commissionAgreement.notes}
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No commission agreement set yet.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="overline" color="text.secondary">Booking</Typography>
                  <Button size="small" startIcon={<Edit />} onClick={() => {
                    if (prospect.booking) {
                      setBookingForm({
                        bookedAt: prospect.booking.bookedAt ? prospect.booking.bookedAt.split('T')[0] : '',
                        unitInfo: prospect.booking.unitInfo || '',
                        salePrice: prospect.booking.salePrice ?? '',
                        currency: prospect.booking.currency || 'INR',
                        notes: prospect.booking.notes || '',
                      });
                    }
                    setOpenBooking(true);
                  }}>
                    {prospect.booking ? 'Edit' : 'Record'}
                  </Button>
                </Stack>
                {prospect.booking ? (
                  <>
                    <Typography variant="body2">Booked: {fmtDate(prospect.booking.bookedAt)}</Typography>
                    {prospect.booking.unitInfo && (
                      <Typography variant="body2">Unit: {prospect.booking.unitInfo}</Typography>
                    )}
                    <Typography variant="body2">
                      Sale Price: <strong>{fmtMoney(prospect.booking.salePrice, prospect.booking.currency || 'INR')}</strong>
                    </Typography>
                    {prospect.booking.notes && (
                      <Typography variant="caption" color="text.secondary">{prospect.booking.notes}</Typography>
                    )}
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No booking recorded yet.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="overline" color="text.secondary">Commission Summary</Typography>
                  <Chip size="small" label={commissionStatus} color={COMMISSION_COLOR[commissionStatus] || 'default'} />
                </Stack>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Expected</Typography>
                    <Typography variant="h6">{fmtMoney(expected, commissionCcy)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Received</Typography>
                    <Typography variant="h6">{fmtMoney(totalReceived, commissionCcy)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">Balance</Typography>
                    <Typography variant="h6">{fmtMoney(balance, commissionCcy)}</Typography>
                  </Grid>
                </Grid>
                {prospect.writeOffReason && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    Written off: {prospect.writeOffReason}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="overline" color="text.secondary">Payments Ledger</Typography>
                  <Stack direction="row" spacing={1}>
                    {canWriteOff && commissionStatus !== 'paid' && commissionStatus !== 'written_off' && (
                      <Button size="small" color="error" startIcon={<MoneyOff />}
                        onClick={() => setOpenWriteOff(true)}>
                        Write Off
                      </Button>
                    )}
                    <Button size="small" variant="contained" startIcon={<Add />}
                      onClick={() => setOpenPayment(true)}
                      disabled={commissionStatus === 'written_off'}>
                      Record Payment
                    </Button>
                  </Stack>
                </Stack>
                {payments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No payments recorded.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Amount</TableCell>
                        <TableCell>Received</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Reference</TableCell>
                        <TableCell>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payments.map((p, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{fmtMoney(p.amount, commissionCcy)}</TableCell>
                          <TableCell>{fmtDate(p.receivedAt)}</TableCell>
                          <TableCell>{p.method || '—'}</TableCell>
                          <TableCell>{p.referenceNumber || '—'}</TableCell>
                          <TableCell>{p.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Log Activity dialog */}
      <Dialog open={openActivity} onClose={() => !activityBusy && setOpenActivity(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Activity</DialogTitle>
        <DialogContent dividers>
          <TextField select fullWidth size="small" label="Type" sx={{ mb: 2 }}
            value={activityForm.type} onChange={(e) => setActivityForm((f) => ({ ...f, type: e.target.value }))}>
            {ACTIVITY_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </TextField>
          <TextField fullWidth size="small" multiline minRows={3} label="Note" sx={{ mb: 2 }}
            value={activityForm.note} onChange={(e) => setActivityForm((f) => ({ ...f, note: e.target.value }))} />
          {activityForm.type === 'follow_up_scheduled' && (
            <Stack direction="row" spacing={2}>
              <TextField fullWidth size="small" type="datetime-local" label="Follow-up date"
                InputLabelProps={{ shrink: true }}
                value={activityForm.followUpDate}
                onChange={(e) => setActivityForm((f) => ({ ...f, followUpDate: e.target.value }))} />
              <TextField select fullWidth size="small" label="Follow-up type"
                value={activityForm.followUpType}
                onChange={(e) => setActivityForm((f) => ({ ...f, followUpType: e.target.value }))}>
                {FOLLOW_UP_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenActivity(false)} disabled={activityBusy}>Cancel</Button>
          <Button variant="contained" onClick={submitActivity} disabled={activityBusy}>
            {activityBusy ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Propose Status dialog */}
      <Dialog open={openStatus} onClose={() => !statusBusy && setOpenStatus(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Propose Status Change</DialogTitle>
        <DialogContent dividers>
          <TextField select fullWidth size="small" required label="New status" sx={{ mb: 2 }}
            value={statusForm.status} onChange={(e) => setStatusForm((f) => ({ ...f, status: e.target.value }))}>
            {PROSPECT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField fullWidth size="small" multiline minRows={3} label="Note for developer"
            value={statusForm.note} onChange={(e) => setStatusForm((f) => ({ ...f, note: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenStatus(false)} disabled={statusBusy}>Cancel</Button>
          <Button variant="contained" onClick={submitProposeStatus} disabled={statusBusy}>
            {statusBusy ? 'Sending…' : 'Send Proposal'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* External status update */}
      <Dialog open={openExternalStatus} onClose={() => !externalStatusBusy && setOpenExternalStatus(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Update Status</DialogTitle>
        <DialogContent dividers>
          <TextField select fullWidth size="small" required label="Status"
            value={externalStatusVal} onChange={(e) => setExternalStatusVal(e.target.value)}>
            {PROSPECT_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenExternalStatus(false)} disabled={externalStatusBusy}>Cancel</Button>
          <Button variant="contained" onClick={submitExternalStatus} disabled={externalStatusBusy}>
            {externalStatusBusy ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Booking dialog */}
      <Dialog open={openBooking} onClose={() => !bookingBusy && setOpenBooking(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{prospect.booking ? 'Edit Booking' : 'Record Booking'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" required type="date" label="Booked At"
                InputLabelProps={{ shrink: true }}
                value={bookingForm.bookedAt}
                onChange={(e) => setBookingForm((f) => ({ ...f, bookedAt: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Unit Info"
                value={bookingForm.unitInfo}
                onChange={(e) => setBookingForm((f) => ({ ...f, unitInfo: e.target.value }))} />
            </Grid>
            <Grid item xs={8}>
              <TextField fullWidth size="small" required type="number" label="Sale Price"
                value={bookingForm.salePrice}
                onChange={(e) => setBookingForm((f) => ({ ...f, salePrice: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth size="small" label="Currency"
                value={bookingForm.currency}
                onChange={(e) => setBookingForm((f) => ({ ...f, currency: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline minRows={2} label="Notes"
                value={bookingForm.notes}
                onChange={(e) => setBookingForm((f) => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenBooking(false)} disabled={bookingBusy}>Cancel</Button>
          <Button variant="contained" onClick={submitBooking} disabled={bookingBusy}>
            {bookingBusy ? 'Saving…' : 'Save Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment dialog */}
      <Dialog open={openPayment} onClose={() => !paymentBusy && setOpenPayment(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth size="small" required type="number" label="Amount"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" required type="date" label="Received At"
                InputLabelProps={{ shrink: true }}
                value={paymentForm.receivedAt}
                onChange={(e) => setPaymentForm((f) => ({ ...f, receivedAt: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField select fullWidth size="small" label="Method"
                value={paymentForm.method}
                onChange={(e) => setPaymentForm((f) => ({ ...f, method: e.target.value }))}>
                {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Reference Number"
                value={paymentForm.referenceNumber}
                onChange={(e) => setPaymentForm((f) => ({ ...f, referenceNumber: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline minRows={2} label="Notes"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenPayment(false)} disabled={paymentBusy}>Cancel</Button>
          <Button variant="contained" onClick={submitPayment} disabled={paymentBusy}>
            {paymentBusy ? 'Saving…' : 'Save Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Commission agreement dialog */}
      <Dialog open={openCommission} onClose={() => !commissionBusy && setOpenCommission(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Commission Agreement</DialogTitle>
        <DialogContent dividers>
          <RadioGroup row value={commissionForm.type}
            onChange={(e) => setCommissionForm((f) => ({ ...f, type: e.target.value }))} sx={{ mb: 1 }}>
            <FormControlLabel value="percentage" control={<Radio />} label="Percentage" />
            <FormControlLabel value="flat" control={<Radio />} label="Flat" />
          </RadioGroup>
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <TextField fullWidth size="small" required type="number" label="Value"
                value={commissionForm.value}
                onChange={(e) => setCommissionForm((f) => ({ ...f, value: e.target.value }))} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth size="small" label="Currency"
                value={commissionForm.currency}
                onChange={(e) => setCommissionForm((f) => ({ ...f, currency: e.target.value }))}
                disabled={commissionForm.type === 'percentage'} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline minRows={2} label="Notes"
                value={commissionForm.notes}
                onChange={(e) => setCommissionForm((f) => ({ ...f, notes: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenCommission(false)} disabled={commissionBusy}>Cancel</Button>
          <Button variant="contained" onClick={submitCommission} disabled={commissionBusy}>
            {commissionBusy ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Write-off dialog */}
      <Dialog open={openWriteOff} onClose={() => !writeOffBusy && setOpenWriteOff(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Write Off Commission</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This marks the commission as written off. The action is logged for audit.
          </Alert>
          <TextField fullWidth multiline minRows={3} required label="Reason"
            value={writeOffReason} onChange={(e) => setWriteOffReason(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenWriteOff(false)} disabled={writeOffBusy}>Cancel</Button>
          <Button variant="contained" color="error" onClick={submitWriteOff} disabled={writeOffBusy}>
            {writeOffBusy ? 'Writing off…' : 'Confirm Write-Off'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProspectDetailPage;

// File: src/components/reports/ScheduleDeliveryDialog.js
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Switch, FormControlLabel,
  TextField, MenuItem, Grid, Typography, IconButton, Box, Divider,
} from '@mui/material';
import { Add, DeleteOutline } from '@mui/icons-material';

const DOW = [['Sun', 0], ['Mon', 1], ['Tue', 2], ['Wed', 3], ['Thu', 4], ['Fri', 5], ['Sat', 6]];

/**
 * Edits a template's schedule + delivery + access (controlled).
 * @param {{ open, schedule, delivery, access, onScheduleChange, onDeliveryChange, onAccessChange, onClose }} props
 *   onScheduleChange(patch); onDeliveryChange(patch); onAccessChange(patch)
 */
const ScheduleDeliveryDialog = ({ open, schedule = {}, delivery = {}, access = {}, onScheduleChange, onDeliveryChange, onAccessChange, onClose }) => {
  const recipients = Array.isArray(delivery.recipients) ? delivery.recipients : [];

  const setRecipient = (i, patch) => {
    const next = recipients.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onDeliveryChange({ recipients: next });
  };
  const addRecipient = () => onDeliveryChange({ recipients: [...recipients, { email: '', name: '', role: '', _key: `r_${Date.now()}_${Math.random().toString(36).slice(2)}` }] });
  const removeRecipient = (i) => onDeliveryChange({ recipients: recipients.filter((_, idx) => idx !== i) });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Schedule & delivery</DialogTitle>
      <DialogContent>
        <FormControlLabel
          control={<Switch checked={!!schedule.enabled} onChange={(e) => onScheduleChange({ enabled: e.target.checked })} />}
          label="Send on a recurring schedule"
        />
        {schedule.enabled && (
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}>
              <TextField select fullWidth size="small" label="Frequency" value={schedule.frequency || 'monthly'}
                onChange={(e) => onScheduleChange({ frequency: e.target.value })}>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
              </TextField>
            </Grid>
            {schedule.frequency === 'weekly' && (
              <Grid item xs={6}>
                <TextField select fullWidth size="small" label="Day" value={schedule.dayOfWeek ?? 1}
                  onChange={(e) => onScheduleChange({ dayOfWeek: Number(e.target.value) })}>
                  {DOW.map(([l, v]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                </TextField>
              </Grid>
            )}
            {schedule.frequency === 'monthly' && (
              <Grid item xs={6}>
                <TextField type="number" fullWidth size="small" label="Day of month (1–28)" value={schedule.dayOfMonth ?? 1}
                  onChange={(e) => onScheduleChange({ dayOfMonth: Math.min(Math.max(Number(e.target.value) || 1, 1), 28) })} />
              </Grid>
            )}
            <Grid item xs={6}>
              <TextField type="time" fullWidth size="small" label="Time" InputLabelProps={{ shrink: true }}
                value={schedule.time || '09:00'} onChange={(e) => onScheduleChange({ time: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Timezone" value={schedule.timezone || 'Asia/Kolkata'}
                onChange={(e) => onScheduleChange({ timezone: e.target.value })} />
            </Grid>
          </Grid>
        )}

        <Divider sx={{ my: 2 }} />

        <TextField select fullWidth size="small" label="When generated" value={delivery.mode || 'review_then_send'}
          onChange={(e) => onDeliveryChange({ mode: e.target.value })} sx={{ mb: 2 }}>
          <MenuItem value="review_then_send">Hold for review, then send after approval</MenuItem>
          <MenuItem value="auto_send">Send automatically (no review)</MenuItem>
        </TextField>

        <TextField select fullWidth size="small" label="Viewer access" value={access.gate || 'email'}
          onChange={(e) => onAccessChange({ gate: e.target.value })} sx={{ mb: 2 }}>
          <MenuItem value="email">Email gate (enter email to view)</MenuItem>
          <MenuItem value="email_otp">Email + one-time code (more secure)</MenuItem>
        </TextField>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>Stakeholder recipients</Typography>
        {recipients.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>No recipients yet.</Typography>}
        {recipients.map((r, i) => (
          <Box key={r._key || r.email || i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField size="small" type="email" label="Email" value={r.email || ''} sx={{ flex: 2 }}
              onChange={(e) => setRecipient(i, { email: e.target.value })} />
            <TextField size="small" label="Name" value={r.name || ''} sx={{ flex: 1 }}
              onChange={(e) => setRecipient(i, { name: e.target.value })} />
            <IconButton size="small" onClick={() => removeRecipient(i)}><DeleteOutline fontSize="small" /></IconButton>
          </Box>
        ))}
        <Button size="small" startIcon={<Add />} onClick={addRecipient}>Add recipient</Button>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleDeliveryDialog;

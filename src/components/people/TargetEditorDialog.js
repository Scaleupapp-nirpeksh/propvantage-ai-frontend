import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { peopleAPI } from '../../services/api';

const FIELDS = [
  { key: 'salesCount',  label: 'Sales Count (monthly)' },
  { key: 'salesValue',  label: 'Sales Value (₹)' },
  { key: 'leadsWorked', label: 'Leads Worked' },
  { key: 'conversions', label: 'Conversions' },
  { key: 'taskSlaRate', label: 'Task SLA Rate (%)' },
];

const TargetEditorDialog = ({ open, onClose, userId, onSaved }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    peopleAPI.getTargets(userId)
      .then(r => setValues(r.data?.data?.targets || {}))
      .catch(() => setValues({}))
      .finally(() => setLoading(false));
  }, [open, userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await peopleAPI.setTargets(userId, values);
      enqueueSnackbar('Targets saved.', { variant: 'success' });
      onSaved?.();
      onClose();
    } catch (e) {
      enqueueSnackbar(e.response?.data?.message || 'Failed to save targets.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Targets</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />
        ) : (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {FIELDS.map(({ key, label }) => (
              <Grid item xs={12} sm={6} key={key}>
                <TextField
                  label={label}
                  type="number"
                  fullWidth
                  size="small"
                  value={values[key] ?? ''}
                  onChange={e => setValues(prev => ({ ...prev, [key]: e.target.value === '' ? undefined : Number(e.target.value) }))}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TargetEditorDialog;

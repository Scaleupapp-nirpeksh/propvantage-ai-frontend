import React, { useState } from 'react';
import { Box, TextField, Button, Typography, CircularProgress } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { peopleAPI } from '../../services/api';

const ManagerAck = ({ reflectionId, existingAck, onAcked }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [note, setNote] = useState(existingAck?.note || '');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(!!existingAck?.by);

  const handleAck = async () => {
    setSaving(true);
    try {
      await peopleAPI.ackReflection(reflectionId, note);
      setDone(true);
      enqueueSnackbar('Reflection acknowledged.', { variant: 'success' });
      onAcked?.();
    } catch (e) {
      enqueueSnackbar(e.response?.data?.message || 'Failed to acknowledge.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'success.50', borderRadius: 1 }}>
        <CheckCircle sx={{ color: 'success.main', fontSize: 18 }} />
        <Typography variant="body2" color="success.main">You acknowledged this reflection.</Typography>
        {note && <Typography variant="caption" color="text.secondary">Note: {note}</Typography>}
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Manager Acknowledgement</Typography>
      <TextField
        multiline
        minRows={2}
        fullWidth
        size="small"
        label="Private note (optional)"
        value={note}
        onChange={e => setNote(e.target.value)}
        sx={{ mb: 1 }}
      />
      <Button
        variant="outlined"
        size="small"
        startIcon={saving ? <CircularProgress size={14} /> : <CheckCircle />}
        disabled={saving}
        onClick={handleAck}
      >
        {saving ? 'Saving…' : 'Acknowledge'}
      </Button>
    </Box>
  );
};

export default ManagerAck;

// File: src/components/reports/OverrideDialog.js
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box } from '@mui/material';

/**
 * Override a KPI block's value (fieldPath 'data.value').
 * @param {{ open, block, onClose, onSave }} props  onSave({ blockId, fieldPath, originalValue, newValue, reason })
 */
const OverrideDialog = ({ open, block, onClose, onSave }) => {
  const original = block?.data?.value ?? '';
  const [newValue, setNewValue] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => { if (open) { setNewValue(String(original)); setReason(''); } }, [open, original]);

  const handleSave = () => {
    const num = Number(newValue);
    onSave({
      blockId: block.id,
      fieldPath: 'data.value',
      originalValue: original,
      newValue: Number.isNaN(num) ? newValue : num,
      reason,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Override "{block?.title || block?.type}"</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">Current value</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>{String(original)}</Typography>
          <TextField fullWidth size="small" label="Corrected value" value={newValue}
            onChange={(e) => setNewValue(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth multiline minRows={2} size="small" label="Reason (recorded for the audit trail)"
            value={reason} onChange={(e) => setReason(e.target.value)} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!reason.trim()}>Save override</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OverrideDialog;

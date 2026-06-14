// File: src/components/reports/FlagDialog.js
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem,
} from '@mui/material';

const SEVERITIES = [{ v: 'info', l: 'Info' }, { v: 'warn', l: 'Warning' }, { v: 'critical', l: 'Critical' }];

/**
 * Flag a block for correction and assign an owner.
 * @param {{ open, block, users, onClose, onSave }} props
 *   users = [{ _id, firstName, lastName }]; onSave({ blockId, note, severity, assignedTo })
 */
const FlagDialog = ({ open, block, users = [], onClose, onSave }) => {
  const [note, setNote] = useState('');
  const [severity, setSeverity] = useState('warn');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => { if (open) { setNote(''); setSeverity('warn'); setAssignedTo(''); } }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Flag "{block?.title || block?.type}"</DialogTitle>
      <DialogContent>
        <TextField fullWidth multiline minRows={2} size="small" label="What's wrong?" value={note}
          onChange={(e) => setNote(e.target.value)} sx={{ mt: 1, mb: 2 }} />
        <TextField select fullWidth size="small" label="Severity" value={severity}
          onChange={(e) => setSeverity(e.target.value)} sx={{ mb: 2 }}>
          {SEVERITIES.map((s) => <MenuItem key={s.v} value={s.v}>{s.l}</MenuItem>)}
        </TextField>
        <TextField select fullWidth size="small" label="Assign to (notified to fix the source)" value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}>
          <MenuItem value="">Unassigned</MenuItem>
          {users.map((u) => <MenuItem key={u._id} value={u._id}>{u.firstName} {u.lastName}</MenuItem>)}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="warning" onClick={() => onSave({ blockId: block.id, note, severity, assignedTo: assignedTo || undefined })}
          disabled={!note.trim()}>Raise flag</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlagDialog;

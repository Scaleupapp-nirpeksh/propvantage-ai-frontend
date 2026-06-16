// src/pages/workspace/SharingSettings.js
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box,
  FormControl, InputLabel, Select, MenuItem, Chip, ToggleButtonGroup,
  ToggleButton, Typography, OutlinedInput, CircularProgress,
} from '@mui/material';
import { Lock, Public } from '@mui/icons-material';
import { useWorkspace } from '../../context/WorkspaceContext';
import { userAPI, rolesAPI } from '../../services/api';

// Static fallback role names (used if rolesAPI is unavailable).
const FALLBACK_ROLES = [
  'Business Head', 'Project Director', 'Sales Head', 'Sales Manager',
  'Sales Executive', 'Finance Head', 'Finance Manager',
];

const SharingSettings = ({ open, onClose, card }) => {
  const { updateCard } = useWorkspace();

  const [visibility, setVisibility] = useState('private');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(FALLBACK_ROLES);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !card) return;
    setVisibility(card.visibility || 'private');
    setSelectedUsers(card.sharedWithUsers || []);
    setSelectedRoles(card.sharedWithRoles || []);

    let cancelled = false;
    setLoading(true);
    Promise.all([
      userAPI.getUsers({ status: 'active', limit: 200 }),
      rolesAPI.getRoles().catch(() => null),
    ])
      .then(([uRes, rRes]) => {
        if (cancelled) return;
        const uList = uRes.data?.data?.users || uRes.data?.data || uRes.data || [];
        setUsers(Array.isArray(uList) ? uList : []);
        const rList = rRes?.data?.data?.roles || rRes?.data?.data || rRes?.data || null;
        if (Array.isArray(rList) && rList.length) {
          setRoles(rList.map((r) => r.name).filter(Boolean));
        }
      })
      .catch(() => { /* keep fallbacks */ })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open, card]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCard(card._id, {
        visibility,
        sharedWithUsers: visibility === 'shared' ? selectedUsers : [],
        sharedWithRoles: visibility === 'shared' ? selectedRoles : [],
      });
      onClose();
    } catch {
      /* surfaced by context */
    } finally {
      setSaving(false);
    }
  };

  const userLabel = (id) => {
    const u = users.find((x) => x._id === id);
    return u ? `${u.firstName} ${u.lastName || ''}`.trim() : id;
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share "{card?.title}"</DialogTitle>
      <DialogContent dividers>
        <ToggleButtonGroup
          value={visibility}
          exclusive
          size="small"
          onChange={(e, v) => v && setVisibility(v)}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="private"><Lock sx={{ fontSize: 16, mr: 0.5 }} /> Private</ToggleButton>
          <ToggleButton value="shared"><Public sx={{ fontSize: 16, mr: 0.5 }} /> Shared</ToggleButton>
        </ToggleButtonGroup>

        {visibility === 'shared' && (
          loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={22} /></Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Recipients see this card re-run under their own access — sharing never exposes data they couldn't already see.
              </Typography>

              <FormControl size="small" fullWidth>
                <InputLabel>Share with users</InputLabel>
                <Select
                  multiple
                  value={selectedUsers}
                  onChange={(e) => setSelectedUsers(e.target.value)}
                  input={<OutlinedInput label="Share with users" />}
                  renderValue={(ids) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {ids.map((id) => <Chip key={id} size="small" label={userLabel(id)} />)}
                    </Box>
                  )}
                >
                  {users.map((u) => (
                    <MenuItem key={u._id} value={u._id}>
                      {u.firstName} {u.lastName} {u.role ? `· ${u.role}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Share with roles</InputLabel>
                <Select
                  multiple
                  value={selectedRoles}
                  onChange={(e) => setSelectedRoles(e.target.value)}
                  input={<OutlinedInput label="Share with roles" />}
                  renderValue={(vals) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {vals.map((r) => <Chip key={r} size="small" label={r} />)}
                    </Box>
                  )}
                >
                  {roles.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          )
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ textTransform: 'none' }}>
          {saving ? 'Saving…' : 'Save sharing'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SharingSettings;

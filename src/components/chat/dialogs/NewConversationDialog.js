import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Tabs, Tab, Box, Typography, List, ListItemButton, ListItemAvatar,
  Avatar, ListItemText, Chip, CircularProgress, InputAdornment,
  IconButton, alpha, useTheme,
} from '@mui/material';
import { Search, Close, Group, Person } from '@mui/icons-material';
import { userAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useChat } from '../../../context/ChatContext';

const NewConversationDialog = ({ open, onClose, onCreated }) => {
  const theme = useTheme();
  const { user, canAccess } = useAuth();
  const { createConversation } = useChat();
  const [tab, setTab] = useState(0); // 0 = direct, 1 = group
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const canCreateGroup = canAccess.chatCreateGroup();

  // Search users
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await userAPI.getUsers({ search: search || '', limit: 20 });
        const data = res.data?.data || res.data;
        const allUsers = data.users || data || [];
        setUsers(allUsers.filter((u) => u._id !== user?._id));
      } catch {
        setUsers([]);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [open, search, user?._id]);

  const handleReset = useCallback(() => {
    setTab(0);
    setSearch('');
    setSelectedUsers([]);
    setGroupName('');
  }, []);

  useEffect(() => {
    if (open) handleReset();
  }, [open, handleReset]);

  const toggleUser = (u) => {
    if (tab === 0) {
      // Direct: select one and create immediately
      handleCreateDirect(u);
    } else {
      setSelectedUsers((prev) =>
        prev.some((s) => s._id === u._id)
          ? prev.filter((s) => s._id !== u._id)
          : [...prev, u]
      );
    }
  };

  const handleCreateDirect = async (targetUser) => {
    setCreating(true);
    try {
      const conv = await createConversation({
        type: 'direct',
        participantIds: [targetUser._id],
      });
      onCreated(conv);
    } catch {
      // Error handled by API interceptor
    }
    setCreating(false);
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length === 0) return;
    setCreating(true);
    try {
      const conv = await createConversation({
        type: 'group',
        participantIds: selectedUsers.map((u) => u._id),
        name: groupName || 'New Group',
      });
      onCreated(conv);
    } catch {
      // Error handled by API interceptor
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={600}>New Conversation</Typography>
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {canCreateGroup && (
          <Tabs
            value={tab}
            onChange={(_, v) => { setTab(v); setSelectedUsers([]); }}
            sx={{ px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}
          >
            <Tab icon={<Person sx={{ fontSize: 18 }} />} iconPosition="start" label="Direct Message" sx={{ textTransform: 'none' }} />
            <Tab icon={<Group sx={{ fontSize: 18 }} />} iconPosition="start" label="Group Chat" sx={{ textTransform: 'none' }} />
          </Tabs>
        )}

        <Box sx={{ px: 3, py: 2 }}>
          {tab === 1 && (
            <TextField
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              size="small"
              fullWidth
              sx={{ mb: 1.5 }}
            />
          )}

          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            size="small"
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment>,
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
        </Box>

        {/* Selected chips for group */}
        {tab === 1 && selectedUsers.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 3, pb: 1 }}>
            {selectedUsers.map((u) => (
              <Chip
                key={u._id}
                label={`${u.firstName} ${u.lastName}`}
                size="small"
                onDelete={() => setSelectedUsers((prev) => prev.filter((s) => s._id !== u._id))}
                sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}
              />
            ))}
          </Box>
        )}

        {/* User list */}
        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : users.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              No users found
            </Typography>
          ) : (
            <List disablePadding>
              {users.map((u) => {
                const isSelected = selectedUsers.some((s) => s._id === u._id);
                return (
                  <ListItemButton
                    key={u._id}
                    onClick={() => toggleUser(u)}
                    selected={isSelected}
                    sx={{ px: 3 }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={u.profileImage}
                        sx={{ width: 36, height: 36, fontSize: '0.75rem', bgcolor: alpha(theme.palette.primary.main, 0.15), color: 'primary.main' }}
                      >
                        {`${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${u.firstName} ${u.lastName}`}
                      secondary={u.email}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    {u.role?.name && (
                      <Chip label={u.role.name} size="small" sx={{ height: 20, fontSize: '0.6rem' }} />
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>
      </DialogContent>

      {tab === 1 && (
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            disabled={selectedUsers.length === 0 || creating}
            startIcon={creating ? <CircularProgress size={16} /> : null}
          >
            Create Group
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default NewConversationDialog;

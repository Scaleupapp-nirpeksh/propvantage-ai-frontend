import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Box, Typography,
  IconButton, CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useChat } from '../../../context/ChatContext';
import { useSnackbar } from 'notistack';

const CATEGORIES = ['General', 'Sales', 'Marketing', 'Finance', 'Operations', 'Support', 'HR'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const CreateTaskDialog = ({ open, message, onClose }) => {
  const { createTaskFromMessage } = useChat();
  const { enqueueSnackbar } = useSnackbar();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!message?._id) return;
    setCreating(true);
    try {
      const data = {
        title: title || 'Task from chat message',
        category,
        priority,
      };
      if (dueDate) data.dueDate = new Date(dueDate).toISOString();

      const task = await createTaskFromMessage(message._id, data);
      enqueueSnackbar(`Task created: ${task?.title || title}`, { variant: 'success' });
      onClose();
    } catch {
      enqueueSnackbar('Failed to create task', { variant: 'error' });
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={600}>Create Task from Message</Typography>
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </DialogTitle>

      <DialogContent>
        {message && (
          <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Message content (will be used as description):
            </Typography>
            <Typography variant="body2">
              {message.content?.text || 'No text content'}
            </Typography>
          </Box>
        )}

        <TextField
          label="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          size="small"
          placeholder="Task from chat message"
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Category</InputLabel>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} label="Category">
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)} label="Priority">
              {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        <TextField
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          fullWidth
          size="small"
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={creating}
          startIcon={creating ? <CircularProgress size={16} /> : null}
        >
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTaskDialog;

import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, Button, MenuItem, Select,
  FormControl, InputLabel, Chip, Autocomplete, IconButton, Switch, FormControlLabel,
  alpha, useTheme,
} from '@mui/material';
import { Save, ArrowBack, Add, Close } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI, userAPI } from '../../services/api';
import { PageHeader } from '../../components/common';
import { DetailPageSkeleton } from '../../components/common/LoadingSkeleton';
import { TASK_CATEGORIES, TASK_PRIORITIES, RECURRENCE_PATTERNS, LINKED_ENTITY_TYPES } from '../../constants/taskConfig';

const CreateEditTaskPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { taskId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { checkPermission } = useAuth();
  const isEditMode = Boolean(taskId);

  const canAssign = checkPermission ? checkPermission('tasks:assign') : true;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [assignedTo, setAssignedTo] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [checklistInput, setChecklistInput] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState({ pattern: 'weekly', interval: 1 });
  const [linkedEntityType, setLinkedEntityType] = useState('');
  const [linkedEntityId, setLinkedEntityId] = useState('');
  const [linkedEntityLabel, setLinkedEntityLabel] = useState('');
  const [slaTarget, setSlaTarget] = useState('');
  const [slaWarning, setSlaWarning] = useState('');

  // Data state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch users for assignment + existing task in edit mode
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const promises = [userAPI.getUsers({ limit: 200 })];
        if (isEditMode) promises.push(tasksAPI.getTask(taskId));

        const results = await Promise.all(promises);
        if (cancelled) return;

        // Users
        const userData = results[0].data?.data?.users || results[0].data?.data || results[0].data || [];
        setUsers(Array.isArray(userData) ? userData : []);

        // Existing task (edit mode)
        if (isEditMode && results[1]) {
          const t = results[1].data?.data?.task || results[1].data?.data || results[1].data?.task || results[1].data;
          setTitle(t.title || '');
          setDescription(t.description || '');
          setCategory(t.category || 'General');
          setPriority(t.priority || 'Medium');
          setDueDate(t.dueDate ? t.dueDate.split('T')[0] : '');
          setStartDate(t.startDate ? t.startDate.split('T')[0] : '');
          setAssignedTo(t.assignedTo || null);
          setTags(t.tags || []);
          setChecklist(t.checklist || []);
          setIsRecurring(Boolean(t.recurrence?.isRecurring));
          if (t.recurrence) setRecurrence(t.recurrence);
          if (t.linkedEntity) {
            setLinkedEntityType(t.linkedEntity.entityType || '');
            setLinkedEntityId(t.linkedEntity.entityId || '');
            setLinkedEntityLabel(t.linkedEntity.displayLabel || '');
          }
          if (t.sla) {
            setSlaTarget(t.sla.targetResolutionHours || '');
            setSlaWarning(t.sla.warningThresholdHours || '');
          }
        }
      } catch {
        if (!cancelled) {
          enqueueSnackbar('Failed to load data', { variant: 'error' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [isEditMode, taskId, enqueueSnackbar]);

  const validate = () => {
    const next = {};
    if (!title.trim()) next.title = 'Title is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        tags,
        checklist: checklist.map((item, idx) => ({
          text: item.text,
          order: idx,
          ...(item._id ? { _id: item._id } : {}),
        })),
      };
      if (dueDate) payload.dueDate = dueDate;
      if (startDate) payload.startDate = startDate;
      if (assignedTo) payload.assignedTo = assignedTo._id || assignedTo.id || assignedTo;
      if (isRecurring) payload.recurrence = { ...recurrence, isRecurring: true };
      if (linkedEntityType && linkedEntityId) {
        payload.linkedEntity = {
          entityType: linkedEntityType,
          entityId: linkedEntityId,
          displayLabel: linkedEntityLabel || undefined,
        };
      }
      if (slaTarget) {
        payload.sla = {
          targetResolutionHours: Number(slaTarget),
          ...(slaWarning ? { warningThresholdHours: Number(slaWarning) } : {}),
        };
      }

      let result;
      if (isEditMode) {
        result = await tasksAPI.updateTask(taskId, payload);
        enqueueSnackbar('Task updated', { variant: 'success' });
      } else {
        result = await tasksAPI.createTask(payload);
        enqueueSnackbar('Task created', { variant: 'success' });
      }

      const newTaskId = result.data?.data?.task?._id || result.data?.data?._id || taskId;
      navigate(newTaskId ? `/tasks/${newTaskId}` : '/tasks');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Something went wrong';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const addChecklistItem = () => {
    if (!checklistInput.trim()) return;
    setChecklist((prev) => [...prev, { text: checklistInput.trim(), isCompleted: false }]);
    setChecklistInput('');
  };

  const removeChecklistItem = (idx) => {
    setChecklist((prev) => prev.filter((_, i) => i !== idx));
  };

  const addTag = () => {
    if (!tagInput.trim() || tags.includes(tagInput.trim())) return;
    setTags((prev) => [...prev, tagInput.trim()]);
    setTagInput('');
  };

  if (loading) {
    return (
      <Box>
        <PageHeader
          title={isEditMode ? 'Edit Task' : 'Create Task'}
          actions={<Button startIcon={<ArrowBack />} onClick={() => navigate('/tasks')} sx={{ textTransform: 'none' }}>Back</Button>}
          loading
        />
        <DetailPageSkeleton />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={isEditMode ? 'Edit Task' : 'Create Task'}
        subtitle={isEditMode ? 'Update task details' : 'Define a new task'}
        actions={
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/tasks')} sx={{ textTransform: 'none' }}>
            Back
          </Button>
        }
      />

      {/* Task details */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2.5 }}>Task Details</Typography>

        <Grid container spacing={3}>
          {/* Left column */}
          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: '' })); }}
                required
                fullWidth
                size="small"
                error={Boolean(errors.title)}
                helperText={errors.title}
                disabled={submitting}
              />

              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={4}
                size="small"
                disabled={submitting}
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)} disabled={submitting}>
                      {TASK_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value)} disabled={submitting}>
                      {TASK_PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Right column */}
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {canAssign && (
                <Autocomplete
                  options={users}
                  getOptionLabel={(u) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || ''}
                  value={assignedTo}
                  onChange={(_, val) => setAssignedTo(val)}
                  renderInput={(params) => <TextField {...params} label="Assign To" size="small" />}
                  isOptionEqualToValue={(opt, val) => (opt._id || opt.id) === (val?._id || val?.id)}
                  disabled={submitting}
                />
              )}

              <TextField
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                disabled={submitting}
              />

              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                disabled={submitting}
              />

              {/* Tags */}
              <Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    size="small"
                    fullWidth
                    disabled={submitting}
                  />
                  <Button size="small" onClick={addTag} disabled={!tagInput.trim()}>Add</Button>
                </Box>
                {tags.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" onDelete={() => setTags((p) => p.filter((t) => t !== tag))} />
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Checklist builder */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Checklist</Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            placeholder="Add checklist item..."
            value={checklistInput}
            onChange={(e) => setChecklistInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }}
            size="small"
            fullWidth
            disabled={submitting}
          />
          <Button startIcon={<Add />} onClick={addChecklistItem} disabled={!checklistInput.trim()} sx={{ textTransform: 'none' }}>
            Add
          </Button>
        </Box>

        {checklist.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {checklist.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: 1, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                <Typography variant="body2" sx={{ flex: 1 }}>{idx + 1}. {item.text}</Typography>
                <IconButton size="small" onClick={() => removeChecklistItem(idx)}>
                  <Close sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Linked Entity */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Link to Entity (Optional)</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Entity Type</InputLabel>
              <Select
                value={linkedEntityType}
                label="Entity Type"
                onChange={(e) => setLinkedEntityType(e.target.value)}
                disabled={submitting}
              >
                <MenuItem value="">None</MenuItem>
                {LINKED_ENTITY_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Entity ID"
              value={linkedEntityId}
              onChange={(e) => setLinkedEntityId(e.target.value)}
              fullWidth
              size="small"
              disabled={submitting || !linkedEntityType}
              placeholder="Paste entity ID"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Display Label"
              value={linkedEntityLabel}
              onChange={(e) => setLinkedEntityLabel(e.target.value)}
              fullWidth
              size="small"
              disabled={submitting || !linkedEntityType}
              placeholder="e.g. Ravi Sharma"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* SLA */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>SLA Settings (Optional)</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Target Resolution (hours)"
              type="number"
              value={slaTarget}
              onChange={(e) => setSlaTarget(e.target.value)}
              fullWidth
              size="small"
              InputProps={{ inputProps: { min: 1 } }}
              disabled={submitting}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Warning Threshold (hours)"
              type="number"
              value={slaWarning}
              onChange={(e) => setSlaWarning(e.target.value)}
              fullWidth
              size="small"
              InputProps={{ inputProps: { min: 1 } }}
              disabled={submitting}
              helperText="Alert before SLA breach"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Recurrence */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 3, mb: 3 }}>
        <FormControlLabel
          control={<Switch checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} disabled={submitting} />}
          label={<Typography variant="subtitle1" fontWeight={600}>Recurring Task</Typography>}
        />

        {isRecurring && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Pattern</InputLabel>
                <Select
                  value={recurrence.pattern}
                  label="Pattern"
                  onChange={(e) => setRecurrence((p) => ({ ...p, pattern: e.target.value }))}
                  disabled={submitting}
                >
                  {RECURRENCE_PATTERNS.map((rp) => <MenuItem key={rp.value} value={rp.value}>{rp.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Interval"
                type="number"
                value={recurrence.interval}
                onChange={(e) => setRecurrence((p) => ({ ...p, interval: Number(e.target.value) }))}
                size="small"
                fullWidth
                InputProps={{ inputProps: { min: 1, max: 12 } }}
                disabled={submitting}
              />
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pb: 4 }}>
        <Button variant="outlined" onClick={() => navigate('/tasks')} disabled={submitting} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSubmit}
          disabled={submitting}
          sx={{ textTransform: 'none', minWidth: 140 }}
        >
          {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Task'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateEditTaskPage;

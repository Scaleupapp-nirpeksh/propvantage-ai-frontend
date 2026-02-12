import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, Button, MenuItem, Select,
  FormControl, InputLabel, IconButton, alpha, useTheme,
} from '@mui/material';
import { Save, ArrowBack, Add, Close, Delete } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { tasksAPI } from '../../services/api';
import { PageHeader } from '../../components/common';
import { DetailPageSkeleton } from '../../components/common/LoadingSkeleton';
import { TASK_CATEGORIES, TASK_PRIORITIES } from '../../constants/taskConfig';

const CreateEditTemplatePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { templateId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const isEditMode = Boolean(templateId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [defaultTitle, setDefaultTitle] = useState('');
  const [defaultPriority, setDefaultPriority] = useState('Medium');
  const [defaultDueDays, setDefaultDueDays] = useState('');
  const [defaultTags, setDefaultTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [checklistTemplate, setChecklistTemplate] = useState([]);
  const [checklistInput, setChecklistInput] = useState('');
  const [subTaskDefs, setSubTaskDefs] = useState([]);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;
    const fetchTemplate = async () => {
      try {
        const res = await tasksAPI.getTemplate(templateId);
        const t = res.data?.data?.template || res.data?.data || res.data;
        if (!cancelled && t) {
          setName(t.name || '');
          setDescription(t.description || '');
          setCategory(t.category || 'General');
          setDefaultTitle(t.defaultTitle || '');
          setDefaultPriority(t.defaultPriority || 'Medium');
          setDefaultDueDays(t.defaultDueDays != null ? String(t.defaultDueDays) : '');
          setDefaultTags(t.defaultTags || []);
          setChecklistTemplate(t.checklistTemplate || []);
          setSubTaskDefs(t.subTaskDefinitions || []);
        }
      } catch {
        if (!cancelled) {
          enqueueSnackbar('Failed to load template', { variant: 'error' });
          navigate('/tasks/templates');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTemplate();
    return () => { cancelled = true; };
  }, [isEditMode, templateId, enqueueSnackbar, navigate]);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = 'Template name is required';
    if (!category) next.category = 'Category is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        defaultTitle: defaultTitle.trim(),
        defaultPriority,
        defaultTags,
        checklistTemplate: checklistTemplate.map((item, idx) => ({
          text: item.text || item,
          order: idx,
        })),
        subTaskDefinitions: subTaskDefs.filter((s) => s.title?.trim()),
      };
      if (defaultDueDays) payload.defaultDueDays = Number(defaultDueDays);

      if (isEditMode) {
        await tasksAPI.updateTemplate(templateId, payload);
        enqueueSnackbar('Template updated', { variant: 'success' });
      } else {
        await tasksAPI.createTemplate(payload);
        enqueueSnackbar('Template created', { variant: 'success' });
      }
      navigate('/tasks/templates');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Something went wrong';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const addChecklistItem = () => {
    if (!checklistInput.trim()) return;
    setChecklistTemplate((prev) => [...prev, { text: checklistInput.trim() }]);
    setChecklistInput('');
  };

  const addSubTaskDef = () => {
    setSubTaskDefs((prev) => [...prev, { title: '', priority: 'Medium', dueDaysOffset: 0 }]);
  };

  const updateSubTaskDef = (idx, field, value) => {
    setSubTaskDefs((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const removeSubTaskDef = (idx) => {
    setSubTaskDefs((prev) => prev.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <Box>
        <PageHeader title={isEditMode ? 'Edit Template' : 'Create Template'} loading />
        <DetailPageSkeleton />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={isEditMode ? 'Edit Template' : 'Create Template'}
        subtitle={isEditMode ? 'Update template settings' : 'Define a reusable task template'}
        actions={
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/tasks/templates')} sx={{ textTransform: 'none' }}>
            Back
          </Button>
        }
      />

      {/* Basic info */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2.5 }}>Template Info</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Template Name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: '' })); }}
              required
              fullWidth
              size="small"
              error={Boolean(errors.name)}
              helperText={errors.name}
              disabled={submitting}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small" error={Boolean(errors.category)}>
              <InputLabel>Category</InputLabel>
              <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)} disabled={submitting}>
                {TASK_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              size="small"
              disabled={submitting}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Defaults */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2.5 }}>Default Values</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField label="Default Title" value={defaultTitle} onChange={(e) => setDefaultTitle(e.target.value)} fullWidth size="small" disabled={submitting} />
          </Grid>
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select value={defaultPriority} label="Priority" onChange={(e) => setDefaultPriority(e.target.value)} disabled={submitting}>
                {TASK_PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField label="Due in (days)" type="number" value={defaultDueDays} onChange={(e) => setDefaultDueDays(e.target.value)} fullWidth size="small" InputProps={{ inputProps: { min: 0 } }} disabled={submitting} />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField placeholder="Add tag..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (tagInput.trim()) { setDefaultTags((p) => [...p, tagInput.trim()]); setTagInput(''); } } }} size="small" sx={{ width: 180 }} disabled={submitting} />
              {defaultTags.map((tag) => (
                <Box key={tag} component="span">
                  <Typography variant="body2" component="span" sx={{ mr: 0.5 }}>{tag}</Typography>
                  <IconButton size="small" onClick={() => setDefaultTags((p) => p.filter((t) => t !== tag))}>
                    <Close sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Checklist template */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Checklist Template</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField placeholder="Add checklist item..." value={checklistInput} onChange={(e) => setChecklistInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }} size="small" fullWidth disabled={submitting} />
          <Button startIcon={<Add />} onClick={addChecklistItem} disabled={!checklistInput.trim()} sx={{ textTransform: 'none' }}>Add</Button>
        </Box>
        {checklistTemplate.map((item, idx) => (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) }, borderRadius: 1 }}>
            <Typography variant="body2" sx={{ flex: 1 }}>{idx + 1}. {item.text || item}</Typography>
            <IconButton size="small" onClick={() => setChecklistTemplate((p) => p.filter((_, i) => i !== idx))}>
              <Close sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ))}
      </Paper>

      {/* Sub-task definitions */}
      <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>Sub-Task Definitions</Typography>
          <Button size="small" startIcon={<Add />} onClick={addSubTaskDef} sx={{ textTransform: 'none' }}>
            Add Sub-Task
          </Button>
        </Box>
        {subTaskDefs.map((def, idx) => (
          <Box key={idx} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center' }}>
            <TextField placeholder="Sub-task title" value={def.title} onChange={(e) => updateSubTaskDef(idx, 'title', e.target.value)} size="small" sx={{ flex: 1 }} disabled={submitting} />
            <FormControl size="small" sx={{ width: 120 }}>
              <Select value={def.priority} onChange={(e) => updateSubTaskDef(idx, 'priority', e.target.value)} disabled={submitting}>
                {TASK_PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Days" type="number" value={def.dueDaysOffset || 0} onChange={(e) => updateSubTaskDef(idx, 'dueDaysOffset', Number(e.target.value))} size="small" sx={{ width: 80 }} InputProps={{ inputProps: { min: 0 } }} disabled={submitting} />
            <IconButton size="small" color="error" onClick={() => removeSubTaskDef(idx)}>
              <Delete sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        ))}
      </Paper>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pb: 4 }}>
        <Button variant="outlined" onClick={() => navigate('/tasks/templates')} disabled={submitting} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button variant="contained" startIcon={<Save />} onClick={handleSubmit} disabled={submitting} sx={{ textTransform: 'none', minWidth: 140 }}>
          {submitting ? 'Saving...' : isEditMode ? 'Save Template' : 'Create Template'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateEditTemplatePage;

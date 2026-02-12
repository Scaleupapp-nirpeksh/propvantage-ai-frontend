import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Button, Chip, IconButton, alpha, useTheme,
} from '@mui/material';
import { Add, Edit, Delete, PlayArrow } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI } from '../../services/api';
import { PageHeader, EmptyState, ConfirmDialog } from '../../components/common';
import { CardGridSkeleton } from '../../components/common/LoadingSkeleton';
import { CATEGORY_COLORS } from '../../constants/taskConfig';

const TaskTemplatesPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { checkPermission } = useAuth();

  const canManage = checkPermission ? checkPermission('tasks:manage_templates') : false;

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchTemplates = async () => {
      try {
        const res = await tasksAPI.getTemplates();
        if (!cancelled) {
          const data = res.data?.data?.templates || res.data?.data || res.data || [];
          setTemplates(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) enqueueSnackbar('Failed to load templates', { variant: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTemplates();
    return () => { cancelled = true; };
  }, [enqueueSnackbar]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await tasksAPI.deleteTemplate(deleteId);
      setTemplates((prev) => prev.filter((t) => (t._id || t.id) !== deleteId));
      enqueueSnackbar('Template deleted', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to delete template', { variant: 'error' });
    } finally {
      setDeleteId(null);
    }
  };

  const handleApply = async (templateId) => {
    try {
      const res = await tasksAPI.applyTemplate(templateId, {});
      const newTaskId = res.data?.data?.task?._id || res.data?.data?._id;
      enqueueSnackbar('Template applied — task created', { variant: 'success' });
      if (newTaskId) navigate(`/tasks/${newTaskId}`);
      else navigate('/tasks');
    } catch {
      enqueueSnackbar('Failed to apply template', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box>
        <PageHeader title="Task Templates" loading />
        <CardGridSkeleton />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Task Templates"
        subtitle={`${templates.length} templates`}
        actions={
          canManage && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/tasks/templates/create')}
              sx={{ textTransform: 'none' }}
            >
              Create Template
            </Button>
          )
        }
      />

      {templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Templates help you quickly create common task types"
          action={canManage ? { label: 'Create Template', onClick: () => navigate('/tasks/templates/create') } : undefined}
        />
      ) : (
        <Grid container spacing={2}>
          {templates.map((template) => {
            const id = template._id || template.id;
            const catColor = CATEGORY_COLORS[template.category] || theme.palette.grey[500];
            return (
              <Grid item xs={12} sm={6} md={4} key={id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': { borderColor: alpha(catColor, 0.4), boxShadow: theme.shadows[2] },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>{template.name}</Typography>
                      {template.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          {template.description}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={template.category || 'General'}
                      size="small"
                      sx={{ height: 22, fontSize: '0.625rem', fontWeight: 600, bgcolor: alpha(catColor, 0.1), color: catColor }}
                    />
                  </Box>

                  {/* Stats */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {template.subTaskDefinitions?.length > 0 && (
                      <Chip label={`${template.subTaskDefinitions.length} sub-tasks`} size="small" sx={{ height: 20, fontSize: '0.625rem' }} />
                    )}
                    {template.checklistTemplate?.length > 0 && (
                      <Chip label={`${template.checklistTemplate.length} checklist items`} size="small" sx={{ height: 20, fontSize: '0.625rem' }} />
                    )}
                    {template.usageCount > 0 && (
                      <Chip label={`Used ${template.usageCount}x`} size="small" sx={{ height: 20, fontSize: '0.625rem' }} />
                    )}
                  </Box>

                  <Box sx={{ flex: 1 }} />

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      startIcon={<PlayArrow sx={{ fontSize: 16 }} />}
                      onClick={() => handleApply(id)}
                      sx={{ textTransform: 'none' }}
                    >
                      Apply
                    </Button>
                    {canManage && (
                      <>
                        <IconButton size="small" onClick={() => navigate(`/tasks/templates/${id}`)}>
                          <Edit sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setDeleteId(id)}>
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Template"
        message="Are you sure you want to delete this template?"
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};

export default TaskTemplatesPage;

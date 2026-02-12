import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Switch, Button, useTheme } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { notificationsAPI } from '../../services/api';
import { PageHeader } from '../../components/common';
import { FormSkeleton } from '../../components/common/LoadingSkeleton';
import { NOTIFICATION_CATEGORIES } from '../../constants/notificationConfig';

const NotificationPreferencesPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchPrefs = async () => {
      try {
        const res = await notificationsAPI.getPreferences();
        const data = res.data?.data || res.data || {};
        if (!cancelled) setPreferences(data.preferences || {});
      } catch {
        if (!cancelled) enqueueSnackbar('Failed to load preferences', { variant: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPrefs();
    return () => { cancelled = true; };
  }, [enqueueSnackbar]);

  const handleToggle = async (key, value) => {
    const prev = { ...preferences };
    setPreferences((p) => ({ ...p, [key]: value }));

    setSaving(true);
    try {
      await notificationsAPI.updatePreferences({ preferences: { [key]: value } });
    } catch {
      setPreferences(prev); // revert on failure
      enqueueSnackbar('Failed to update preference', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <PageHeader
          title="Notification Preferences"
          actions={<Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ textTransform: 'none' }}>Back</Button>}
          loading
        />
        <FormSkeleton />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Notification Preferences"
        subtitle="Choose which notifications you receive"
        actions={
          <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ textTransform: 'none' }}>
            Back
          </Button>
        }
      />

      {NOTIFICATION_CATEGORIES.map((category) => (
        <Paper
          key={category.label}
          elevation={0}
          sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2, p: 3, mb: 3 }}
        >
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            {category.label}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {category.types.map((type) => (
              <Box
                key={type.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1,
                  px: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: theme.palette.action.hover },
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={500}>{type.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{type.description}</Typography>
                </Box>
                <Switch
                  checked={preferences[type.key] !== false}
                  onChange={(e) => handleToggle(type.key, e.target.checked)}
                  disabled={saving}
                  size="small"
                />
              </Box>
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default NotificationPreferencesPage;

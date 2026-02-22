// File: src/pages/competitive-analysis/DataProvidersPage.js
// Data provider management — enable/disable, view sync status, trigger sync

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  Chip,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  Sync,
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
  CloudDone,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { competitiveAnalysisAPI } from '../../services/api';
import { PageHeader, CardGridSkeleton } from '../../components/common';
import { formatDistanceToNow } from 'date-fns';

const PROVIDER_INFO = {
  manual: {
    name: 'Manual Entry',
    description: 'Manually enter competitor data through the form interface.',
    status: 'available',
  },
  csv_import: {
    name: 'CSV Import',
    description: 'Bulk import competitor data from CSV files with automatic deduplication.',
    status: 'available',
  },
  ai_research: {
    name: 'AI Research',
    description: 'AI-powered web scraping of property portals (99acres, MagicBricks, Housing.com, RERA).',
    status: 'available',
  },
  propstack: {
    name: 'Propstack',
    description: 'Real estate data API for market intelligence and pricing data.',
    status: 'coming_soon',
  },
  squareyards: {
    name: 'Square Yards',
    description: 'Property listing and analytics data provider.',
    status: 'coming_soon',
  },
  zapkey: {
    name: 'ZapKey',
    description: 'RERA-based real estate data and transaction records.',
    status: 'coming_soon',
  },
};

const SYNC_STATUS_CONFIG = {
  success: { label: 'Success', color: 'success', icon: CheckCircle },
  failed: { label: 'Failed', color: 'error', icon: ErrorIcon },
  pending: { label: 'Pending', color: 'warning', icon: Schedule },
};

const DataProvidersPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [syncing, setSyncing] = useState({});
  const [toggling, setToggling] = useState({});

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await competitiveAnalysisAPI.getProviders();
      setProviders(res.data?.data || []);
    } catch {
      enqueueSnackbar('Failed to load providers', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const handleToggle = async (providerName, currentEnabled) => {
    try {
      setToggling(prev => ({ ...prev, [providerName]: true }));
      await competitiveAnalysisAPI.updateProvider(providerName, { isEnabled: !currentEnabled });
      setProviders(prev =>
        prev.map(p => p.providerName === providerName ? { ...p, isEnabled: !currentEnabled } : p)
      );
      enqueueSnackbar(`${PROVIDER_INFO[providerName]?.name || providerName} ${!currentEnabled ? 'enabled' : 'disabled'}`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to update provider', { variant: 'error' });
    } finally {
      setToggling(prev => ({ ...prev, [providerName]: false }));
    }
  };

  const handleSync = async (providerName) => {
    try {
      setSyncing(prev => ({ ...prev, [providerName]: true }));
      await competitiveAnalysisAPI.syncProvider(providerName);
      enqueueSnackbar('Sync completed', { variant: 'success' });
      fetchProviders();
    } catch (error) {
      const status = error.response?.status;
      if (status === 501) {
        enqueueSnackbar(error.response?.data?.message || 'Sync not yet implemented for this provider', { variant: 'info' });
      } else {
        enqueueSnackbar(error.response?.data?.message || 'Sync failed', { variant: 'error' });
      }
    } finally {
      setSyncing(prev => ({ ...prev, [providerName]: false }));
    }
  };

  // Build a map from fetched providers
  const providerMap = {};
  providers.forEach(p => { providerMap[p.providerName] = p; });

  // Merge with known providers
  const allProviders = Object.entries(PROVIDER_INFO).map(([key, info]) => ({
    ...info,
    providerName: key,
    ...(providerMap[key] || {}),
  }));

  if (loading) return <CardGridSkeleton />;

  return (
    <Box>
      <PageHeader
        title="Data Providers"
        subtitle="Configure competitive data sources and sync settings"
        badge="BETA"
        actions={
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/competitive-analysis')}>
            Back to Dashboard
          </Button>
        }
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        Data providers supply competitor information to the platform. Enable or disable providers as needed.
        API-based providers (Propstack, Square Yards, ZapKey) are coming soon.
      </Alert>

      <Grid container spacing={3}>
        {allProviders.map((provider) => {
          const info = PROVIDER_INFO[provider.providerName] || {};
          const isComingSoon = info.status === 'coming_soon';
          const syncConfig = provider.syncConfig || {};
          const syncStatusCfg = SYNC_STATUS_CONFIG[syncConfig.lastSyncStatus];
          const isEnabled = provider.isEnabled !== false;

          return (
            <Grid item xs={12} sm={6} md={4} key={provider.providerName}>
              <Card
                variant="outlined"
                sx={{
                  height: '100%',
                  opacity: isComingSoon ? 0.7 : 1,
                  position: 'relative',
                }}
              >
                <CardContent>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>{info.name}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        {isComingSoon ? (
                          <Chip label="Coming Soon" size="small" color="default" variant="outlined" />
                        ) : (
                          <Chip
                            label={isEnabled ? 'Enabled' : 'Disabled'}
                            size="small"
                            color={isEnabled ? 'success' : 'default'}
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                    {!isComingSoon && (
                      <Switch
                        checked={isEnabled}
                        onChange={() => handleToggle(provider.providerName, isEnabled)}
                        disabled={toggling[provider.providerName]}
                        size="small"
                      />
                    )}
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {info.description}
                  </Typography>

                  {/* Sync Status */}
                  {syncConfig.lastSyncAt && (
                    <Box sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                        {syncStatusCfg && (
                          <Chip
                            icon={<syncStatusCfg.icon sx={{ fontSize: 14 }} />}
                            label={syncStatusCfg.label}
                            size="small"
                            color={syncStatusCfg.color}
                            variant="outlined"
                          />
                        )}
                        {syncConfig.lastSyncRecordCount != null && (
                          <Typography variant="caption" color="text.secondary">
                            {syncConfig.lastSyncRecordCount} records
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Last sync: {formatDistanceToNow(new Date(syncConfig.lastSyncAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                  )}

                  {/* Actions */}
                  {!isComingSoon && (
                    <Button
                      size="small"
                      startIcon={<Sync />}
                      onClick={() => handleSync(provider.providerName)}
                      disabled={syncing[provider.providerName] || !isEnabled}
                      variant="outlined"
                      fullWidth
                    >
                      {syncing[provider.providerName] ? 'Syncing...' : 'Trigger Sync'}
                    </Button>
                  )}
                  {isComingSoon && (
                    <Button
                      size="small"
                      variant="outlined"
                      disabled
                      fullWidth
                      startIcon={<CloudDone />}
                    >
                      Coming Soon
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default DataProvidersPage;

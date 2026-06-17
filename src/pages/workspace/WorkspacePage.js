// src/pages/workspace/WorkspacePage.js
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Typography, Grid, Stack, Chip, Skeleton,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { Add, ViewQuilt, AutoAwesome, Refresh } from '@mui/icons-material';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PageHeader } from '../../components/common';
import { getStarterCardsForRole } from './starterCards';
import WorkspaceBoard from './WorkspaceBoard';
import CardBuilderDialog from './CardBuilderDialog';
import SharedWithMeTray from './SharedWithMeTray';
import RoleDashboard from './RoleDashboard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getInitialViewMode = (searchParams) => {
  const param = searchParams.get('view');
  if (param === 'my' || param === 'standard') return param;
  const stored = localStorage.getItem('pv.viewMode');
  if (stored === 'my' || stored === 'standard') return stored;
  return 'my';
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const WorkspacePage = () => {
  const { user, isChannelPartnerOrg } = useAuth();
  const {
    layout, loading, refresh, createCard, addToBoard,
  } = useWorkspace();

  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState(() => getInitialViewMode(searchParams));

  const [builderOpen, setBuilderOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Sync viewMode when the ?view= param changes after mount (e.g. /dashboard
  // redirect, nav clicks, or browser back/forward).
  useEffect(() => {
    const param = searchParams.get('view');
    if ((param === 'my' || param === 'standard') && param !== viewMode) {
      setViewMode(param);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Channel-partner-org guard — mirror the old DashboardRouter guard.
  if (isChannelPartnerOrg) {
    return <Navigate to="/partner/dashboard" replace />;
  }

  const boardCount = (layout.items || []).length;
  const starters = getStarterCardsForRole(user?.role);

  const handleViewModeChange = (_event, newMode) => {
    if (!newMode) return; // exclusive toggle — ignore deselect
    setViewMode(newMode);
    setSearchParams({ view: newMode }, { replace: true });
    localStorage.setItem('pv.viewMode', newMode);
  };

  // Create the suggested starter cards and place them on the board.
  const handleSeedStarters = async () => {
    setSeeding(true);
    try {
      for (const def of starters) {
        const created = await createCard({
          title: def.title,
          module: def.module,
          queryPlan: def.queryPlan,
          renderMode: def.renderMode,
          metricConfig: def.metricConfig,
          visibility: 'private',
          sharedWithUsers: [],
          sharedWithRoles: [],
        });
        if (created?._id) await addToBoard(created._id, def.renderMode === 'metric' ? 'sm' : 'md');
      }
    } finally {
      setSeeding(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Segmented toggle bar — visible in both modes
  // ---------------------------------------------------------------------------
  const toggleBar = (
    <Box sx={{ mb: 2 }}>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={handleViewModeChange}
        size="small"
        aria-label="View mode"
        sx={{
          '& .MuiToggleButton-root': {
            textTransform: 'none',
            px: 2.5,
            py: 0.75,
            fontWeight: 500,
          },
        }}
      >
        <ToggleButton value="my">My View</ToggleButton>
        <ToggleButton value="standard">Standard</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );

  // ---------------------------------------------------------------------------
  // Standard mode — show toggle bar + role dashboard only
  // ---------------------------------------------------------------------------
  if (viewMode === 'standard') {
    return (
      <Box>
        {toggleBar}
        <RoleDashboard />
      </Box>
    );
  }

  // ---------------------------------------------------------------------------
  // My View mode — existing board UI with toggle above the header
  // ---------------------------------------------------------------------------
  return (
    <Box>
      {toggleBar}

      <PageHeader
        title="My View"
        subtitle="Your saved, filtered views across every module"
        icon={ViewQuilt}
        actions={
          <>
            <Button
              startIcon={<Refresh />}
              onClick={refresh}
              sx={{ textTransform: 'none' }}
            >
              Refresh all
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setBuilderOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              Add card
            </Button>
          </>
        }
      />

      <SharedWithMeTray />

      {loading ? (
        <Grid container spacing={2}>
          {[0, 1, 2].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton variant="rounded" height={240} />
            </Grid>
          ))}
        </Grid>
      ) : boardCount === 0 ? (
        <Paper
          elevation={0}
          sx={{
            border: (t) => `1px dashed ${t.palette.divider}`,
            borderRadius: 3,
            p: { xs: 3, sm: 6 },
            textAlign: 'center',
          }}
        >
          <ViewQuilt sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" fontWeight={700}>
            Build your view
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 520, mx: 'auto' }}>
            Pin saved, filtered views from any module. Start from a suggestion for
            your role, or build your own with the filter builder or plain English.
          </Typography>

          {starters.length > 0 && (
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              flexWrap="wrap"
              useFlexGap
              sx={{ mb: 3 }}
            >
              {starters.map((s) => (
                <Chip key={s.title} label={s.title} variant="outlined" />
              ))}
            </Stack>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<AutoAwesome />}
              onClick={handleSeedStarters}
              disabled={seeding || starters.length === 0}
              sx={{ textTransform: 'none' }}
            >
              {seeding ? 'Adding…' : 'Add suggested cards'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setBuilderOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              Build my own
            </Button>
          </Stack>
        </Paper>
      ) : (
        <WorkspaceBoard />
      )}

      <CardBuilderDialog
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        card={null}
      />
    </Box>
  );
};

export default WorkspacePage;

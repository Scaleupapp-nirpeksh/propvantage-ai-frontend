import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, ToggleButtonGroup, ToggleButton, Grid, Paper,
  CircularProgress, Alert,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { peopleAPI } from '../../services/api';
import Scorecard from '../../components/people/Scorecard';
import MoralePanel from '../../components/people/MoralePanel';
import TargetEditorDialog from '../../components/people/TargetEditorDialog';

const RANGES = [
  { value: 'this_week',    label: 'This Week'    },
  { value: 'last_week',    label: 'Last Week'    },
  { value: 'last_2_weeks', label: 'Last 2 Weeks' },
  { value: 'this_month',   label: 'This Month'   },
];

const TeamPerformancePage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [range, setRange] = useState('this_month');
  const [teamData, setTeamData] = useState(null);
  const [morale, setMorale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(true);
  const [targetUserId, setTargetUserId] = useState(null);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, moraleRes] = await Promise.all([
        peopleAPI.team({ range }),
        peopleAPI.moraleTeam().catch(() => ({ data: null })),
      ]);
      setTeamData(teamRes.data?.data || teamRes.data);
      setMorale(moraleRes.data?.data || moraleRes.data);
    } catch (e) {
      if (e.response?.status === 403) { setAccess(false); }
      else enqueueSnackbar(e.response?.data?.message || 'Failed to load team data.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [range, enqueueSnackbar]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!access) return <Alert severity="error">You don&apos;t have access to Team Performance.</Alert>;
  if (loading) return <CircularProgress size={32} sx={{ display: 'block', mx: 'auto', mt: 6 }} />;

  const members = teamData?.members || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Team Performance</Typography>
        <ToggleButtonGroup value={range} exclusive onChange={(_, v) => v && setRange(v)} size="small">
          {RANGES.map(r => <ToggleButton key={r.value} value={r.value}>{r.label}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>

      {morale && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Team Morale</Typography>
          <MoralePanel data={morale} />
        </Paper>
      )}

      <Grid container spacing={2}>
        {members.map((m) => (
          <Grid item xs={12} md={6} lg={4} key={m.user?._id || m.user?.id}>
            <Scorecard
              user={m.user}
              metrics={m.metrics}
              attainment={m.attainment}
              trend={m.trend}
              vsTeamMedian={m.vsTeamMedian}
              flags={m.flags}
              onClick={() => {
                setTargetUserId(m.user?._id || m.user?.id);
                setTargetDialogOpen(true);
              }}
            />
          </Grid>
        ))}
        {members.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">No team members found.</Alert>
          </Grid>
        )}
      </Grid>

      <TargetEditorDialog
        open={targetDialogOpen}
        onClose={() => setTargetDialogOpen(false)}
        userId={targetUserId}
        onSaved={loadData}
      />
    </Box>
  );
};

export default TeamPerformancePage;

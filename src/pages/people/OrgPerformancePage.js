import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, ToggleButtonGroup, ToggleButton, Grid, Paper,
  CircularProgress, Alert,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { peopleAPI } from '../../services/api';
import Scorecard from '../../components/people/Scorecard';
import MoralePanel from '../../components/people/MoralePanel';

const RANGES = [
  { value: 'this_week',    label: 'This Week'    },
  { value: 'last_week',    label: 'Last Week'    },
  { value: 'last_2_weeks', label: 'Last 2 Weeks' },
  { value: 'this_month',   label: 'This Month'   },
];

const OrgPerformancePage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [range, setRange] = useState('this_month');
  const [orgData, setOrgData] = useState(null);
  const [morale, setMorale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [orgRes, moraleRes] = await Promise.all([
        peopleAPI.org({ range }),
        peopleAPI.moraleOrg().catch(() => ({ data: null })),
      ]);
      setOrgData(orgRes.data?.data || orgRes.data);
      setMorale(moraleRes.data?.data || moraleRes.data);
    } catch (e) {
      if (e.response?.status === 403) { setAccess(false); }
      else enqueueSnackbar(e.response?.data?.message || 'Failed to load org data.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [range, enqueueSnackbar]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!access) return <Alert severity="error">You don&apos;t have access to Organization Performance.</Alert>;
  if (loading) return <CircularProgress size={32} sx={{ display: 'block', mx: 'auto', mt: 6 }} />;

  const heads = orgData?.heads || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Organization Performance</Typography>
        <ToggleButtonGroup value={range} exclusive onChange={(_, v) => v && setRange(v)} size="small">
          {RANGES.map(r => <ToggleButton key={r.value} value={r.value}>{r.label}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>

      {morale && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Organization Morale</Typography>
          <MoralePanel data={morale} />
        </Paper>
      )}

      <Grid container spacing={2}>
        {heads.map((h) => (
          <Grid item xs={12} md={6} lg={4} key={h.user?._id || h.user?.id}>
            <Scorecard
              user={h.user}
              metrics={h.metrics}
              attainment={h.attainment}
              trend={h.trend}
              vsTeamMedian={h.vsTeamMedian}
              flags={h.flags}
            />
          </Grid>
        ))}
        {heads.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">No department heads found.</Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default OrgPerformancePage;

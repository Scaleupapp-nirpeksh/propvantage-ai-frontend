import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, ToggleButtonGroup, ToggleButton, Grid, Paper,
  CircularProgress, Alert, Divider,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { peopleAPI } from '../../services/api';
import Scorecard from '../../components/people/Scorecard';
import MetricTile from '../../components/people/MetricTile';
import MoralePanel from '../../components/people/MoralePanel';

const RANGES = [
  { value: 'this_week',    label: 'This Week'    },
  { value: 'last_week',    label: 'Last Week'    },
  { value: 'last_2_weeks', label: 'Last 2 Weeks' },
  { value: 'this_month',   label: 'This Month'   },
];

const ORG_ROLLUP_TILES = [
  { label: 'Leads Worked',  key: 'leadsWorked',        unit: 'number'   },
  { label: 'Sales Value',   key: 'salesValue',         unit: 'currency' },
  { label: 'Tasks Done',    key: 'tasksCompleted',     unit: 'number'   },
  { label: 'Interactions',  key: 'interactionsLogged', unit: 'number'   },
];

const TEAM_ROLLUP_TILES = [
  { label: 'Team Leads',   key: 'leadsWorked',    unit: 'number'   },
  { label: 'Team Sales',   key: 'salesValue',     unit: 'currency' },
  { label: 'Team Tasks',   key: 'tasksCompleted', unit: 'number'   },
];

/**
 * Normalise attainment from the new shape { key: { actual, target, pct } }
 * to the fraction (0-1) that Scorecard expects (it does * 100 internally).
 */
const normaliseAttainment = (attainment = {}) =>
  Object.fromEntries(
    Object.entries(attainment).map(([k, v]) => [
      k,
      typeof v === 'object' && v !== null && 'pct' in v ? v.pct / 100 : v,
    ])
  );

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
  const orgRollup = orgData?.orgRollup || {};

  return (
    <Box>
      {/* Header + time-range toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Organization Performance</Typography>
        <ToggleButtonGroup value={range} exclusive onChange={(_, v) => v && setRange(v)} size="small">
          {RANGES.map(r => <ToggleButton key={r.value} value={r.value}>{r.label}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>

      {/* Org-level rollup row */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Organization</Typography>
        <Grid container spacing={1.5}>
          {ORG_ROLLUP_TILES.map(({ label, key, unit }) => (
            <Grid item xs={6} sm={3} key={key}>
              <MetricTile label={label} value={orgRollup[key]} unit={unit} />
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Morale panel */}
      {morale && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Organization Morale</Typography>
          <MoralePanel data={morale} />
        </Paper>
      )}

      {/* Per department-head section */}
      <Grid container spacing={2}>
        {heads.map((h) => {
          const teamRollup = h.teamRollup || {};
          const normAttainment = normaliseAttainment(h.attainment);

          return (
            <Grid item xs={12} md={6} lg={4} key={h.user?._id || h.user?.id}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Team size badge above the scorecard */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Team size:
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }} data-testid="team-size">
                    {h.teamSize ?? '—'}
                  </Typography>
                </Box>

                {/* Head's own scorecard */}
                <Scorecard
                  user={h.user}
                  metrics={h.metrics}
                  attainment={normAttainment}
                />

                {/* Compact team rollup line */}
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                    Team Rollup
                  </Typography>
                  <Divider sx={{ mb: 1 }} />
                  <Grid container spacing={1}>
                    {TEAM_ROLLUP_TILES.map(({ label, key, unit }) => (
                      <Grid item xs={4} key={key}>
                        <MetricTile label={label} value={teamRollup[key]} unit={unit} />
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Box>
            </Grid>
          );
        })}

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

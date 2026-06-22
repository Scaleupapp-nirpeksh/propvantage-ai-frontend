import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, ToggleButtonGroup, ToggleButton, Grid, Paper,
  Tab, Tabs, CircularProgress, Alert,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { peopleAPI } from '../../services/api';
import MetricTile from '../../components/people/MetricTile';
import attainmentPct from '../../components/people/attainmentPct';
import RedFlagInbox from '../../components/people/RedFlagInbox';
import ReflectionEditor from '../../components/people/ReflectionEditor';
import ReflectionHistory from '../../components/people/ReflectionHistory';

const RANGES = [
  { value: 'this_week',   label: 'This Week'   },
  { value: 'last_week',   label: 'Last Week'   },
  { value: 'last_2_weeks',label: 'Last 2 Weeks'},
  { value: 'this_month',  label: 'This Month'  },
];

const METRIC_TILES = [
  { label: 'Sales Value',    key: 'salesValue',         unit: 'currency' },
  { label: 'Sales Count',    key: 'salesCount',         unit: 'number'   },
  { label: 'Leads Worked',   key: 'leadsWorked',        unit: 'number'   },
  { label: 'Conversion %',   key: 'conversionRate',     unit: 'percent'  },
  { label: 'Tasks SLA',      key: 'taskSlaRate',        unit: 'percent'  },
  { label: 'Interactions',   key: 'interactionsLogged', unit: 'number'   },
];

const MyPerformancePage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [range, setRange] = useState('this_month');
  const [tab, setTab] = useState(0);
  const [data, setData] = useState(null);
  const [flags, setFlags] = useState({});
  const [reflHistory, setReflHistory] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadReflHistory = useCallback(async () => {
    try {
      const res = await peopleAPI.listReflections();
      setReflHistory(res.data?.data || []);
    } catch {
      // Fail quietly — history is non-critical
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, flagsRes, currentRes] = await Promise.all([
        peopleAPI.me({ range }),
        peopleAPI.flags({}),
        peopleAPI.reflectionCurrent(),
      ]);
      setData(meRes.data?.data || meRes.data);
      setFlags(flagsRes.data?.data?.flags || {});
      setCurrentWeek(currentRes.data?.data?.isoWeek || currentRes.data?.isoWeek);
    } catch (e) {
      enqueueSnackbar(e.response?.data?.message || 'Failed to load performance data.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [range, enqueueSnackbar]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadReflHistory(); }, [loadReflHistory]);

  if (loading) return <CircularProgress size={32} sx={{ display: 'block', mx: 'auto', mt: 6 }} />;

  const metrics = data?.metrics || {};
  const attainment = data?.attainment || {};
  const trend = data?.trend || {};
  const vsMedian = data?.vsTeamMedian || {};

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>My Performance</Typography>
        <ToggleButtonGroup value={range} exclusive onChange={(_, v) => v && setRange(v)} size="small">
          {RANGES.map(r => <ToggleButton key={r.value} value={r.value}>{r.label}</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {METRIC_TILES.map(({ label, key, unit }) => (
          <Grid item xs={6} sm={4} md={2} key={key}>
            <MetricTile
              label={label}
              value={metrics[key]}
              unit={unit}
              trend={trend[key]}
              vsMedian={vsMedian[key]}
              pctTarget={(() => { const frac = attainmentPct(attainment[key]); return frac != null ? Math.round(frac * 100) : undefined; })()}
            />
          </Grid>
        ))}
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Red Flags" />
        <Tab label="Weekly Reflection" />
        <Tab label="History" />
      </Tabs>

      {tab === 0 && (
        <Paper sx={{ p: 2 }}>
          <RedFlagInbox flags={flags} />
        </Paper>
      )}
      {tab === 1 && (
        <Paper sx={{ p: 2 }}>
          {currentWeek ? (
            <ReflectionEditor isoWeek={currentWeek} onSubmitted={() => { loadData(); loadReflHistory(); }} />
          ) : (
            <Alert severity="info">No current reflection period found.</Alert>
          )}
        </Paper>
      )}
      {tab === 2 && (
        <Paper sx={{ p: 2 }}>
          <ReflectionHistory reflections={reflHistory} />
        </Paper>
      )}
    </Box>
  );
};

export default MyPerformancePage;

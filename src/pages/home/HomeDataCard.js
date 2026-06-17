// src/pages/home/HomeDataCard.js
// Renders a data result from the Home intent router as a My-View-style card
// (live preview via the workspace engine) with an "Add to My View" button that
// dedups against existing cards and offers to update a similar one.
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardHeader, CardContent, Chip, Button, Typography, Stack,
} from '@mui/material';
import { ListAlt, ShowChart, AddCircleOutline, CheckCircle, OpenInNew } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { workspaceAPI } from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import { DataTable } from '../../components/common';
import { getModuleCatalog, detailRouteFor } from '../workspace/catalogCache';

// Normalize a plan's filters for similarity comparison (order-independent).
const normFilters = (plan) =>
  JSON.stringify(
    (plan?.filters || [])
      .map((f) => ({ field: f.field, op: f.op, value: f.value }))
      .sort((a, b) => (a.field + a.op).localeCompare(b.field + b.op)),
  );

const HomeDataCard = ({ card }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { cards, createCard, updateCard, addToBoard } = useWorkspace();

  const isMetric = card.renderMode === 'metric';
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState(null);
  const [added, setAdded] = useState(false);
  const [confirmUpdate, setConfirmUpdate] = useState(null); // existing card to maybe update

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    workspaceAPI
      .preview(card.queryPlan, isMetric ? { renderMode: 'metric', metricConfig: card.metricConfig } : { renderMode: 'list' })
      .then((res) => { if (!cancelled) setResult(res.data?.data || null); })
      .catch(() => { if (!cancelled) setResult(isMetric ? { value: 0 } : { rows: [], total: 0 }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [card, isMetric]);

  useEffect(() => {
    if (isMetric) return undefined;
    let cancelled = false;
    getModuleCatalog(card.module).then((c) => { if (!cancelled) setCatalog(c); }).catch(() => {});
    return () => { cancelled = true; };
  }, [card.module, isMetric]);

  const columns = useMemo(() => {
    if (!catalog) return [];
    const displayable = (catalog.fields || []).filter((f) => f.displayable);
    const chosen = [
      ...displayable.filter((f) => f.defaultColumn),
      ...displayable.filter((f) => !f.defaultColumn),
    ].slice(0, 6);
    return chosen.map((f) => ({
      id: f.key,
      label: f.label,
      sortable: false,
      render: (val, row) => {
        const labelVal = row?.[`${f.key}_label`];
        const resolved = (labelVal !== undefined && labelVal !== null && labelVal !== '') ? labelVal : val;
        if (resolved === null || resolved === undefined || resolved === '') return '—';
        if (f.type === 'date') return new Date(resolved).toLocaleDateString();
        if (typeof resolved === 'object') return resolved.name || resolved.title || resolved.firmName || '—';
        return String(resolved);
      },
    }));
  }, [catalog]);

  // A similar existing card = same module + same filters, or same title.
  const twin = useMemo(() => {
    const keyF = normFilters(card.queryPlan);
    const t = (card.title || '').trim().toLowerCase();
    return (cards || []).find(
      (c) => (c.module === card.module && normFilters(c.queryPlan) === keyF) || (c.title || '').trim().toLowerCase() === t,
    ) || null;
  }, [cards, card]);

  const payload = useMemo(() => ({
    title: card.title,
    module: card.module,
    queryPlan: card.queryPlan,
    renderMode: card.renderMode,
    metricConfig: card.metricConfig || { agg: 'count', field: null },
  }), [card]);

  const doCreate = useCallback(async () => {
    const created = await createCard({ ...payload, visibility: 'private', sharedWithUsers: [], sharedWithRoles: [] });
    if (created?._id) await addToBoard(created._id, isMetric ? 'sm' : 'md');
    setAdded(true);
    setConfirmUpdate(null);
    enqueueSnackbar('Added to My View', { variant: 'success' });
  }, [payload, createCard, addToBoard, isMetric, enqueueSnackbar]);

  const handleAdd = () => {
    if (twin) { setConfirmUpdate(twin); return; }
    doCreate();
  };

  const doUpdate = async () => {
    await updateCard(confirmUpdate._id, payload);
    setAdded(true);
    setConfirmUpdate(null);
    enqueueSnackbar(`Updated "${confirmUpdate.title}"`, { variant: 'success' });
  };

  const total = isMetric ? undefined : (result?.total ?? result?.rows?.length ?? 0);

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardHeader
        title={card.title}
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700 }}
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
            <Chip
              size="small"
              icon={isMetric ? <ShowChart sx={{ fontSize: 14 }} /> : <ListAlt sx={{ fontSize: 14 }} />}
              label={card.module}
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
            {!isMetric && total !== undefined && (
              <Chip size="small" color="primary" label={total} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
            )}
          </Box>
        }
        action={
          added ? (
            <Button size="small" startIcon={<OpenInNew />} onClick={() => navigate('/workspace')} sx={{ textTransform: 'none' }}>
              Open My View
            </Button>
          ) : (
            <Button size="small" variant="outlined" startIcon={<AddCircleOutline />} onClick={handleAdd} sx={{ textTransform: 'none' }}>
              Add to My View
            </Button>
          )
        }
        sx={{ pb: 0.5 }}
      />
      <CardContent sx={{ pt: 0.5 }}>
        {confirmUpdate && !added && (
          <Box sx={{ mb: 1.5, p: 1.25, borderRadius: 1.5, bgcolor: (t) => t.palette.warning.light + '22', border: (t) => `1px solid ${t.palette.warning.light}` }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              You already have a similar card <strong>“{confirmUpdate.title}”</strong>.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="contained" onClick={doUpdate} sx={{ textTransform: 'none' }}>Update it</Button>
              <Button size="small" onClick={doCreate} sx={{ textTransform: 'none' }}>Add new</Button>
              <Button size="small" color="inherit" onClick={() => setConfirmUpdate(null)} sx={{ textTransform: 'none' }}>Cancel</Button>
            </Stack>
          </Box>
        )}
        {isMetric ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
            <Typography variant="h3" fontWeight={800}>
              {loading ? '—' : (typeof result?.value === 'number' ? result.value.toLocaleString('en-IN') : (result?.value ?? '—'))}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            <DataTable
              columns={columns}
              rows={result?.rows || []}
              loading={loading}
              onRowClick={(row) => { const r = detailRouteFor(card.module, row); if (r) navigate(r); }}
              emptyState={{ title: 'No matching records', description: 'Nothing matches this right now.' }}
              elevation={0}
              sx={{ boxShadow: 'none', border: 'none' }}
            />
          </Box>
        )}
        {added && (
          <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <CheckCircle sx={{ fontSize: 14 }} /> Saved to My View
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default HomeDataCard;

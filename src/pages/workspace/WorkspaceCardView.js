// src/pages/workspace/WorkspaceCardView.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, CardHeader, IconButton, Menu, MenuItem,
  ListItemIcon, ListItemText, Tooltip, Chip, Divider,
} from '@mui/material';
import {
  MoreVert, Refresh, Edit, Share, RemoveCircleOutline, DeleteOutline,
  DragIndicator, ListAlt, ShowChart,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { workspaceAPI } from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import { DataTable, KPICard } from '../../components/common';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CardBuilderDialog from './CardBuilderDialog';
import SharingSettings from './SharingSettings';
import { getModuleCatalog, detailRouteFor } from './catalogCache';

const WorkspaceCardView = ({ card, size = 'md', dragHandleProps }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { deleteCard, removeFromBoard } = useWorkspace();

  const [result, setResult] = useState(null); // { rows, total } | { value, breakdown }
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState(null);
  const [menuEl, setMenuEl] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const isMetric = card.renderMode === 'metric';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workspaceAPI.getCardData(card._id);
      setResult(res.data?.data || null);
    } catch (err) {
      setResult(isMetric ? { value: 0 } : { rows: [], total: 0 });
      enqueueSnackbar(`"${card.title}" failed to load`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [card._id, card.title, isMetric, enqueueSnackbar]);

  // Catalog drives the displayable columns for list mode.
  const loadCatalog = useCallback(async () => {
    if (isMetric) return;
    try {
      const cat = await getModuleCatalog(card.module);
      setCatalog(cat);
    } catch {
      setCatalog(null);
    }
  }, [card.module, isMetric]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  // Build DataTable columns from catalog displayable fields (defaultColumn first).
  const columns = useMemo(() => {
    if (!catalog) return [];
    const fields = (catalog.fields || []).filter((f) => f.displayable);
    const ordered = [
      ...fields.filter((f) => f.defaultColumn),
      ...fields.filter((f) => !f.defaultColumn),
    ].slice(0, 6);
    return ordered.map((f) => ({
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

  const handleRowClick = (row) => {
    const route = detailRouteFor(card.module, row);
    if (route) navigate(route);
  };

  const total = isMetric ? undefined : result?.total ?? (result?.rows?.length || 0);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={
          <Tooltip title="Drag to reorder">
            <IconButton size="small" sx={{ cursor: 'grab', touchAction: 'none' }} {...(dragHandleProps || {})}>
              <DragIndicator fontSize="small" />
            </IconButton>
          </Tooltip>
        }
        title={card.title}
        titleTypographyProps={{ variant: 'subtitle1', fontWeight: 700, noWrap: true }}
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
            <Chip
              size="small"
              icon={isMetric ? <ShowChart sx={{ fontSize: 14 }} /> : <ListAlt sx={{ fontSize: 14 }} />}
              label={card.module}
              sx={{ height: 20, fontSize: '0.65rem' }}
            />
            {!isMetric && total !== undefined && (
              <Chip size="small" label={total} color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
            )}
          </Box>
        }
        action={
          <Box>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={loadData}><Refresh fontSize="small" /></IconButton>
            </Tooltip>
            <IconButton size="small" onClick={(e) => setMenuEl(e.currentTarget)}>
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
        }
        sx={{ pb: 0.5 }}
      />

      <CardContent sx={{ flex: 1, pt: 1, '&:last-child': { pb: 2 } }}>
        {isMetric ? (
          <KPICard
            title={card.title}
            value={loading ? 0 : (result?.value ?? 0)}
            loading={loading}
            subtitle={result?.breakdown ? `${result.breakdown.length} segments` : undefined}
            onClick={loadData}
          />
        ) : (
          <DataTable
            columns={columns}
            rows={result?.rows || []}
            loading={loading}
            onRowClick={handleRowClick}
            emptyState={{
              title: 'No matching records',
              description: 'Nothing matches this card right now.',
            }}
            elevation={0}
            sx={{ boxShadow: 'none', border: 'none' }}
          />
        )}
      </CardContent>

      <Menu anchorEl={menuEl} open={Boolean(menuEl)} onClose={() => setMenuEl(null)}>
        <MenuItem onClick={() => { setEditOpen(true); setMenuEl(null); }}>
          <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setShareOpen(true); setMenuEl(null); }}>
          <ListItemIcon><Share fontSize="small" /></ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { removeFromBoard(card._id); setMenuEl(null); }}>
          <ListItemIcon><RemoveCircleOutline fontSize="small" /></ListItemIcon>
          <ListItemText>Remove from board</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => { setConfirmDeleteOpen(true); setMenuEl(null); }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><DeleteOutline fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <CardBuilderDialog open={editOpen} onClose={() => setEditOpen(false)} card={card} />
      <SharingSettings open={shareOpen} onClose={() => setShareOpen(false)} card={card} />
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete card?"
        message={`Delete "${card.title}"? This removes it for everyone it's shared with.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => { deleteCard(card._id); setConfirmDeleteOpen(false); }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </Card>
  );
};

export default WorkspaceCardView;

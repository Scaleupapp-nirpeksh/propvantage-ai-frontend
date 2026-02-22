// File: src/pages/competitive-analysis/CompetitorListPage.js
// Filterable, paginated competitor list with mobile card view

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Avatar,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add,
  Upload,
  Download,
  Business,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { competitiveAnalysisAPI } from '../../services/api';
import { PageHeader, FilterBar, DataTable } from '../../components/common';
import { formatDistanceToNow } from 'date-fns';

const PROJECT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'mixed_use', label: 'Mixed Use' },
  { value: 'plotted_development', label: 'Plotted Development' },
];

const PROJECT_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pre_launch', label: 'Pre-Launch' },
  { value: 'newly_launched', label: 'Newly Launched' },
  { value: 'under_construction', label: 'Under Construction' },
  { value: 'ready_to_move', label: 'Ready to Move' },
  { value: 'completed', label: 'Completed' },
];

const DATA_SOURCES = [
  { value: '', label: 'All Sources' },
  { value: 'manual', label: 'Manual Entry' },
  { value: 'csv_import', label: 'CSV Import' },
  { value: 'ai_research', label: 'AI Research' },
  { value: 'field_visit', label: 'Field Visit' },
  { value: 'web_research', label: 'Web Research' },
];

const STATUS_LABELS = {
  pre_launch: 'Pre-Launch',
  newly_launched: 'Newly Launched',
  under_construction: 'Under Construction',
  ready_to_move: 'Ready to Move',
  completed: 'Completed',
};

const STATUS_COLORS = {
  pre_launch: '#8e24aa',
  newly_launched: '#1e88e5',
  under_construction: '#fb8c00',
  ready_to_move: '#43a047',
  completed: '#757575',
};

const SOURCE_LABELS = {
  manual: 'Manual',
  csv_import: 'CSV',
  ai_research: 'AI',
  field_visit: 'Field Visit',
  web_research: 'Web',
};

const getFreshnessChip = (days) => {
  if (days == null) return { label: '—', color: 'default' };
  if (days < 30) return { label: 'Fresh', color: 'success' };
  if (days < 90) return { label: 'Aging', color: 'warning' };
  return { label: 'Stale', color: 'error' };
};

const getConfidenceChip = (score) => {
  if (score == null) return { label: '—', color: 'default' };
  if (score >= 80) return { label: `${score}%`, color: 'success' };
  if (score >= 60) return { label: `${score}%`, color: 'info' };
  if (score >= 40) return { label: `${score}%`, color: 'warning' };
  return { label: `${score}%`, color: 'error' };
};

const CompetitorListPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [competitors, setCompetitors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    city: searchParams.get('city') || '',
    area: searchParams.get('area') || '',
    projectType: searchParams.get('projectType') || '',
    projectStatus: searchParams.get('projectStatus') || '',
    dataSource: searchParams.get('dataSource') || '',
  });

  const fetchCompetitors = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: pagination.limit };
      if (filters.search) params.search = filters.search;
      if (filters.city) params.city = filters.city;
      if (filters.area) params.area = filters.area;
      if (filters.projectType) params.projectType = filters.projectType;
      if (filters.projectStatus) params.projectStatus = filters.projectStatus;
      if (filters.dataSource) params.dataSource = filters.dataSource;

      const res = await competitiveAnalysisAPI.getCompetitors(params);
      const data = res.data;
      setCompetitors(data.data || []);
      if (data.pagination) {
        setPagination(prev => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
      }
    } catch (error) {
      enqueueSnackbar('Failed to load competitors', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, enqueueSnackbar]);

  useEffect(() => { fetchCompetitors(); }, [fetchCompetitors]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: '', city: '', area: '', projectType: '', projectStatus: '', dataSource: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExportCSV = async () => {
    try {
      const params = {};
      if (filters.city) params.city = filters.city;
      if (filters.area) params.area = filters.area;
      if (filters.projectType) params.projectType = filters.projectType;
      if (filters.projectStatus) params.projectStatus = filters.projectStatus;

      const res = await competitiveAnalysisAPI.exportCSV(params);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'competitor_data.csv';
      a.click();
      URL.revokeObjectURL(url);
      enqueueSnackbar('CSV exported successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to export CSV', { variant: 'error' });
    }
  };

  const filterConfig = [
    { key: 'search', type: 'search', label: 'Competitors', placeholder: 'Search by name, developer...' },
    { key: 'projectType', type: 'select', label: 'Type', options: PROJECT_TYPES },
    { key: 'projectStatus', type: 'select', label: 'Status', options: PROJECT_STATUSES },
    { key: 'dataSource', type: 'select', label: 'Source', options: DATA_SOURCES },
  ];

  const columns = [
    {
      id: 'projectName', label: 'Project', sortable: true,
      render: (_, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', fontSize: '0.75rem' }}>
            {row.projectName?.charAt(0)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>{row.projectName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{row.developerName}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'location', label: 'Location', hideOnMobile: true,
      render: (_, row) => (
        <Typography variant="body2" noWrap>
          {row.location?.area}{row.location?.city ? `, ${row.location.city}` : ''}
        </Typography>
      ),
    },
    {
      id: 'pricePerSqft', label: 'Avg Price/sqft', sortable: true, hideOnMobile: true,
      render: (_, row) => (
        <Typography variant="body2" fontWeight={600}>
          {row.pricing?.pricePerSqft?.avg ? `₹${row.pricing.pricePerSqft.avg.toLocaleString('en-IN')}` : '—'}
        </Typography>
      ),
    },
    {
      id: 'projectStatus', label: 'Status', width: 140,
      render: (val) => {
        const color = STATUS_COLORS[val] || '#757575';
        return (
          <Chip
            label={STATUS_LABELS[val] || val || '—'}
            size="small"
            sx={{ bgcolor: alpha(color, 0.1), color, fontWeight: 600, fontSize: '0.7rem' }}
          />
        );
      },
    },
    {
      id: 'dataAgeDays', label: 'Freshness', width: 90, hideOnMobile: true,
      render: (val) => {
        const cfg = getFreshnessChip(val);
        return <Chip label={cfg.label} size="small" color={cfg.color} variant="outlined" />;
      },
    },
    {
      id: 'confidenceScore', label: 'Confidence', width: 90, hideOnMobile: true,
      render: (val) => {
        const cfg = getConfidenceChip(val);
        return <Chip label={cfg.label} size="small" color={cfg.color} variant="outlined" />;
      },
    },
    {
      id: 'dataSource', label: 'Source', width: 80, hideOnMobile: true,
      render: (val) => (
        <Typography variant="caption" color="text.secondary">{SOURCE_LABELS[val] || val}</Typography>
      ),
    },
  ];

  const mobileCardRenderer = (row) => {
    const freshCfg = getFreshnessChip(row.dataAgeDays);
    const statusColor = STATUS_COLORS[row.projectStatus] || '#757575';
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>{row.projectName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.developerName} • {row.location?.area}, {row.location?.city}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
          <Typography variant="body2" fontWeight={700} color="primary.main">
            {row.pricing?.pricePerSqft?.avg ? `₹${row.pricing.pricePerSqft.avg.toLocaleString('en-IN')}/sqft` : '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.dataCollectionDate ? formatDistanceToNow(new Date(row.dataCollectionDate), { addSuffix: true }) : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          <Chip
            label={STATUS_LABELS[row.projectStatus] || row.projectStatus || '—'}
            size="small"
            sx={{ bgcolor: alpha(statusColor, 0.1), color: statusColor, fontWeight: 600, fontSize: '0.65rem', height: 22 }}
          />
          <Chip label={freshCfg.label} size="small" color={freshCfg.color} variant="outlined" sx={{ height: 22 }} />
          <Chip label={SOURCE_LABELS[row.dataSource] || row.dataSource} size="small" variant="outlined" sx={{ height: 22 }} />
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <PageHeader
        title="Competitors"
        subtitle="Track and manage competitor projects"
        badge="BETA"
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/competitive-analysis/competitors/new')}>
            Add Competitor
          </Button>
        }
      />

      <FilterBar
        filters={filterConfig}
        values={filters}
        onChange={handleFilterChange}
        onClear={clearFilters}
        extraActions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" startIcon={<Download />} onClick={handleExportCSV}>Export</Button>
            <Button size="small" startIcon={<Upload />} onClick={() => navigate('/competitive-analysis/import')}>Import</Button>
          </Box>
        }
      />

      <DataTable
        columns={columns}
        rows={competitors}
        loading={loading}
        onRowClick={(row) => navigate(`/competitive-analysis/competitors/${row._id}`)}
        responsive="card"
        mobileCardRenderer={mobileCardRenderer}
        pagination={{
          page: pagination.page - 1,
          rowsPerPage: pagination.limit,
          total: pagination.total,
          onPageChange: (newPage) => setPagination(prev => ({ ...prev, page: newPage + 1 })),
        }}
        emptyState={{
          icon: Business,
          title: 'No competitors found',
          description: 'Add your first competitor or try adjusting your filters',
          action: { label: 'Add Competitor', icon: <Add />, onClick: () => navigate('/competitive-analysis/competitors/new') },
        }}
      />
    </Box>
  );
};

export default CompetitorListPage;

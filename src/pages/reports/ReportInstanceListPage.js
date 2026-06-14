// File: src/pages/reports/ReportInstanceListPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Chip, Button } from '@mui/material';
import { Summarize, ArrowBack } from '@mui/icons-material';
import { PageHeader, DataTable, EmptyState } from '../../components/common';
import { reportAPI } from '../../services/api';

const ReportInstanceListPage = () => {
  const navigate = useNavigate();
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportAPI.listInstances({ limit: 100 });
      setInstances(res.data?.data?.instances || []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { fetchInstances(); }, [fetchInstances]);

  const columns = [
    { id: 'title', label: 'Report' },
    { id: 'periodLabel', label: 'Period', render: (r) => r.periodLabel || '—' },
    { id: 'opens', label: 'Unique opens', render: (r) => r.stats?.uniqueViewers ?? 0 },
    { id: 'views', label: 'Total views', render: (r) => r.stats?.totalViews ?? 0 },
    {
      id: 'review', label: 'Review',
      render: (r) => <Chip size="small" variant="outlined"
        color={r.review?.status === 'approved' ? 'success' : r.review?.status === 'in_review' ? 'info' : 'default'}
        label={(r.review?.status || 'draft').replace('_', ' ')} />,
    },
    { id: 'createdAt', label: 'Generated', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : '—') },
  ];

  return (
    <Box>
      <PageHeader
        title="Generated Reports"
        subtitle="Every generated report and how many stakeholders opened it"
        icon={Summarize}
        loading={loading}
        actions={<Button startIcon={<ArrowBack />} onClick={() => navigate('/reports')}>Templates</Button>}
      />
      {!loading && instances.length === 0 ? (
        <EmptyState icon={Summarize} title="No reports generated yet"
          description='Open a template and click "Generate preview" to produce a shareable, tracked report.' />
      ) : (
        <DataTable columns={columns} rows={instances} loading={loading} rowKey="_id"
          onRowClick={(row) => navigate(`/reports/generated/${row._id}/review`)} />
      )}
    </Box>
  );
};

export default ReportInstanceListPage;

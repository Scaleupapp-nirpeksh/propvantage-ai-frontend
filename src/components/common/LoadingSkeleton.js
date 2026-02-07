import React from 'react';
import { Box, Skeleton, Grid, Card, CardContent } from '@mui/material';

/** Skeleton for a row of KPI metric cards */
export const KPIRowSkeleton = ({ count = 4 }) => (
  <Grid container spacing={2}>
    {Array.from({ length: count }).map((_, i) => (
      <Grid item xs={6} sm={6} md={12 / count} key={i}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Skeleton variant="rounded" width={40} height={40} />
              <Skeleton variant="rounded" width={56} height={22} />
            </Box>
            <Skeleton variant="text" width="45%" height={32} />
            <Skeleton variant="text" width="65%" height={16} sx={{ mt: 0.5 }} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

/** Skeleton for a data table */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Card>
    <CardContent sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', gap: 2, p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={20} />
        ))}
      </Box>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <Box key={r} sx={{ display: 'flex', gap: 2, p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} variant="text" width={`${60 + Math.random() * 30}%`} height={18} sx={{ flex: 1 }} />
          ))}
        </Box>
      ))}
    </CardContent>
  </Card>
);

/** Skeleton for a card grid (projects, etc.) */
export const CardGridSkeleton = ({ count = 4 }) => (
  <Grid container spacing={2}>
    {Array.from({ length: count }).map((_, i) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
        <Card>
          <CardContent>
            <Skeleton variant="rounded" width="100%" height={100} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="70%" height={24} />
            <Skeleton variant="text" width="50%" height={18} sx={{ mt: 0.5 }} />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Skeleton variant="rounded" width={60} height={24} />
              <Skeleton variant="rounded" width={60} height={24} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

/** Skeleton for a chart */
export const ChartSkeleton = ({ height = 300 }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton variant="text" width={160} height={24} />
        <Skeleton variant="rounded" width={100} height={28} />
      </Box>
      <Skeleton variant="rounded" width="100%" height={height} />
    </CardContent>
  </Card>
);

/** Skeleton for a detail page (hero info + tabs + content) */
export const DetailPageSkeleton = () => (
  <Box>
    {/* Header */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
      <Skeleton variant="circular" width={48} height={48} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width={200} height={28} />
        <Skeleton variant="text" width={300} height={18} />
      </Box>
      <Skeleton variant="rounded" width={100} height={36} />
    </Box>
    {/* Tabs */}
    <Box sx={{ display: 'flex', gap: 3, mb: 3, borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="text" width={80} height={24} />
      ))}
    </Box>
    {/* Content */}
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            {Array.from({ length: 6 }).map((_, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Skeleton variant="text" width="30%" height={18} />
                <Skeleton variant="text" width="50%" height={18} />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Skeleton variant="text" width={120} height={24} sx={{ mb: 2 }} />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" width="100%" height={48} sx={{ mb: 1 }} />
            ))}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
);

/** Skeleton for a form */
export const FormSkeleton = ({ fields = 6 }) => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width={180} height={28} sx={{ mb: 3 }} />
      <Grid container spacing={2}>
        {Array.from({ length: fields }).map((_, i) => (
          <Grid item xs={12} sm={6} key={i}>
            <Skeleton variant="text" width={100} height={16} sx={{ mb: 0.5 }} />
            <Skeleton variant="rounded" width="100%" height={40} />
          </Grid>
        ))}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
        <Skeleton variant="rounded" width={80} height={36} />
        <Skeleton variant="rounded" width={100} height={36} />
      </Box>
    </CardContent>
  </Card>
);

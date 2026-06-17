// src/pages/workspace/RoleDashboard.js
// Renders the role-appropriate dashboard inline (used by WorkspacePage Standard mode).
// Extracted from App.js DashboardRouter.getDashboardComponent().
import React, { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

// Lazy-load the same dashboard components that App.js uses.
const BusinessHeadDashboard    = React.lazy(() => import('../dashboard/BusinessHeadDashboard'));
const ProjectDirectorDashboard = React.lazy(() => import('../dashboard/ProjectDirectorDashboard'));
const SalesManagerDashboard    = React.lazy(() => import('../dashboard/SalesManagerDashboard'));
const FinanceHeadDashboard     = React.lazy(() => import('../dashboard/FinanceHeadDashboard'));
const SalesExecutiveDashboard  = React.lazy(() => import('../dashboard/SalesExecutiveDashboard'));

const DashboardFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
    <CircularProgress />
  </Box>
);

const RoleDashboard = () => {
  const { user, roleLevel, isOwner, checkPerm } = useAuth();

  const getDashboardComponent = () => {
    // Permission-based routing when roleRef is available
    if (roleLevel !== undefined && roleLevel < 100) {
      if (isOwner || roleLevel <= 5) return <BusinessHeadDashboard />;
      if (roleLevel <= 15) return <ProjectDirectorDashboard />;
      if (checkPerm && (checkPerm('sales:view') || checkPerm('leads:view'))) {
        if (roleLevel <= 30) return <SalesManagerDashboard />;
      }
      if (checkPerm && (checkPerm('payments:view') || checkPerm('commissions:view'))) {
        return <FinanceHeadDashboard />;
      }
    }

    // Fallback: legacy role string
    switch (user?.role) {
      case 'Business Head':
        return <BusinessHeadDashboard />;
      case 'Project Director':
        return <ProjectDirectorDashboard />;
      case 'Sales Head':
      case 'Sales Manager':
        return <SalesManagerDashboard />;
      case 'Finance Head':
      case 'Finance Manager':
        return <FinanceHeadDashboard />;
      case 'Sales Executive':
      case 'Channel Partner Agent':
        return <SalesExecutiveDashboard />;
      default:
        return <SalesExecutiveDashboard />;
    }
  };

  return (
    <Suspense fallback={<DashboardFallback />}>
      {getDashboardComponent()}
    </Suspense>
  );
};

export default RoleDashboard;

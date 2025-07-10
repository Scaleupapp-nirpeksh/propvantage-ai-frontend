// File: src/App.js
// Description: Main App component with routing, theme, and authentication setup for PropVantage AI
// Version: 1.3 - Complete app setup with Villa, Tower, Hybrid project support + Edit/Delete functionality
// Location: src/App.js

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress, Typography } from '@mui/material';
import { SnackbarProvider } from 'notistack';

// Theme and Context Providers
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout Components
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Dashboard Pages (Lazy loaded for performance)
const BusinessHeadDashboard = React.lazy(() => import('./pages/dashboard/BusinessHeadDashboard'));
const SalesExecutiveDashboard = React.lazy(() => import('./pages/dashboard/SalesExecutiveDashboard'));
const SalesManagerDashboard = React.lazy(() => import('./pages/dashboard/SalesManagerDashboard'));
const FinanceHeadDashboard = React.lazy(() => import('./pages/dashboard/FinanceHeadDashboard'));
const ProjectDirectorDashboard = React.lazy(() => import('./pages/dashboard/ProjectDirectorDashboard'));

// Project Management Pages
const ProjectsListPage = React.lazy(() => import('./pages/projects/ProjectsListPage'));
const ProjectDetailPage = React.lazy(() => import('./pages/projects/ProjectDetailPage'));
const TowerDetailPage = React.lazy(() => import('./pages/projects/TowerDetailPage'));
const UnitDetailPage = React.lazy(() => import('./pages/projects/UnitDetailPage'));
const CreateProjectPage = React.lazy(() => import('./pages/projects/CreateProjectPage'));
const CreateTowerPage = React.lazy(() => import('./pages/projects/CreateTowerPage'));
const CreateUnitPage = React.lazy(() => import('./pages/projects/CreateUnitPage'));

// Edit Pages - Complete Edit/Delete Functionality
const EditProjectPage = React.lazy(() => import('./pages/projects/EditProjectPage'));
const EditTowerPage = React.lazy(() => import('./pages/projects/EditTowerPage'));
const EditUnitPage = React.lazy(() => import('./pages/projects/EditUnitPage'));

// Lead Management Pages
const LeadsListPage = React.lazy(() => import('./pages/leads/LeadsListPage'));
const LeadDetailPage = React.lazy(() => import('./pages/leads/LeadDetailPage'));
const CreateLeadPage = React.lazy(() => import('./pages/leads/CreateLeadPage'));
const LeadsPipelinePage = React.lazy(() => import('./pages/leads/LeadsPipelinePage'));

// Sales Management Pages
const SalesListPage = React.lazy(() => import('./pages/sales/SalesListPage'));
const SaleDetailPage = React.lazy(() => import('./pages/sales/SaleDetailPage'));
const CreateSalePage = React.lazy(() => import('./pages/sales/CreateSalePage'));

// Analytics Pages
const AnalyticsDashboard = React.lazy(() => import('./pages/analytics/AnalyticsDashboard'));
const SalesAnalytics = React.lazy(() => import('./pages/analytics/SalesAnalytics'));
const RevenueAnalytics = React.lazy(() => import('./pages/analytics/RevenueAnalytics'));
const LeadAnalytics = React.lazy(() => import('./pages/analytics/LeadAnalytics'));

// Settings and Profile Pages
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage'));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage'));
const UserManagementPage = React.lazy(() => import('./pages/settings/UserManagementPage'));

// Error Pages
const NotFoundPage = React.lazy(() => import('./pages/error/NotFoundPage'));
const UnauthorizedPage = React.lazy(() => import('./pages/error/UnauthorizedPage'));

// Loading Component
const LoadingFallback = ({ message = 'Loading...' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      gap: 2,
    }}
  >
    <CircularProgress size={40} />
    <Typography variant="body1" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// Protected Route Component
const ProtectedRoute = ({ children, requiredPermission, fallback = <UnauthorizedPage /> }) => {
  const { isAuthenticated, isLoading, hasPermission, canAccess } = useAuth();

  if (isLoading) {
    return <LoadingFallback message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check specific permission if provided
  if (requiredPermission) {
    if (typeof requiredPermission === 'string') {
      if (!hasPermission(requiredPermission)) {
        return fallback;
      }
    } else if (typeof requiredPermission === 'function') {
      if (!requiredPermission(canAccess)) {
        return fallback;
      }
    }
  }

  return children;
};

// Role-based Dashboard Router
const DashboardRouter = () => {
  const { user } = useAuth();
  
  // Route to appropriate dashboard based on user role
  const getDashboardComponent = () => {
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
        return <SalesExecutiveDashboard />; // Default fallback
    }
  };

  return getDashboardComponent();
};

// Public Route Component (redirects if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback message="Checking authentication..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        </PublicRoute>
      } />
      
      <Route path="/register" element={
        <PublicRoute>
          <AuthLayout>
            <RegisterPage />
          </AuthLayout>
        </PublicRoute>
      } />
      
      <Route path="/forgot-password" element={
        <PublicRoute>
          <AuthLayout>
            <ForgotPasswordPage />
          </AuthLayout>
        </PublicRoute>
      } />
      
      <Route path="/reset-password" element={
        <PublicRoute>
          <AuthLayout>
            <ResetPasswordPage />
          </AuthLayout>
        </PublicRoute>
      } />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <DashboardRouter />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ========================================= */}
      {/* PROJECT MANAGEMENT ROUTES */}
      {/* Supporting Villa, Tower, and Hybrid Projects */}
      {/* ========================================= */}

      {/* Core Project Routes */}
      <Route path="/projects" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewAllProjects()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <ProjectsListPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/projects/create" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <CreateProjectPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/projects/:projectId" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewAllProjects()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <ProjectDetailPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ========================================= */}
      {/* EDIT FUNCTIONALITY ROUTES */}
      {/* Complete Edit/Delete for Project Hierarchy */}
      {/* ========================================= */}

      {/* Edit Project */}
      <Route path="/projects/:projectId/edit" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading project editor..." />}>
              <EditProjectPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Edit Tower */}
      <Route path="/projects/:projectId/towers/:towerId/edit" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading tower editor..." />}>
              <EditTowerPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Edit Unit in Tower */}
      <Route path="/projects/:projectId/towers/:towerId/units/:unitId/edit" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading unit editor..." />}>
              <EditUnitPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Edit Villa Unit (no tower) */}
      <Route path="/projects/:projectId/units/:unitId/edit" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading villa editor..." />}>
              <EditUnitPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ========================================= */}
      {/* VILLA PROJECT ROUTES */}
      {/* Direct project → units (no towers) */}
      {/* ========================================= */}

      {/* Create Villa Unit - Direct under project */}
      <Route path="/projects/:projectId/units/create" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <CreateUnitPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* View Villa Unit - Direct under project */}
      <Route path="/projects/:projectId/units/:unitId" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewAllProjects()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <UnitDetailPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ========================================= */}
      {/* TOWER PROJECT ROUTES */}
      {/* Project → towers → units */}
      {/* ========================================= */}

      {/* Create Tower - MUST come BEFORE tower detail route */}
      <Route path="/projects/:projectId/towers/create" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <CreateTowerPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* View Tower Details */}
      <Route path="/projects/:projectId/towers/:towerId" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewAllProjects()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <TowerDetailPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Create Tower Unit */}
      <Route path="/projects/:projectId/towers/:towerId/units/create" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <CreateUnitPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* View Tower Unit */}
      <Route path="/projects/:projectId/towers/:towerId/units/:unitId" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewAllProjects()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <UnitDetailPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ========================================= */}
      {/* LEAD MANAGEMENT ROUTES */}
      {/* ========================================= */}

      <Route path="/leads" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <LeadsListPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/leads/create" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <CreateLeadPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/leads/:leadId" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <LeadDetailPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/leads/pipeline" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <LeadsPipelinePage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ========================================= */}
      {/* SALES MANAGEMENT ROUTES */}
      {/* ========================================= */}

      <Route path="/sales" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <SalesListPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/sales/create" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <CreateSalePage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/sales/:saleId" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <SaleDetailPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ========================================= */}
      {/* ANALYTICS ROUTES */}
      {/* ========================================= */}

      <Route path="/analytics" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <AnalyticsDashboard />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/analytics/sales" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <SalesAnalytics />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/analytics/revenue" element={
        <ProtectedRoute requiredPermission="FINANCE">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <RevenueAnalytics />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/analytics/leads" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <LeadAnalytics />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ========================================= */}
      {/* PROFILE AND SETTINGS ROUTES */}
      {/* ========================================= */}

      <Route path="/profile" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <ProfilePage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <SettingsPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings/users" element={
        <ProtectedRoute requiredPermission="ADMIN">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <UserManagementPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ========================================= */}
      {/* ERROR ROUTES */}
      {/* ========================================= */}

      <Route path="/unauthorized" element={
        <Suspense fallback={<LoadingFallback />}>
          <UnauthorizedPage />
        </Suspense>
      } />
      <Route path="/404" element={
        <Suspense fallback={<LoadingFallback />}>
          <NotFoundPage />
        </Suspense>
      } />

      {/* ========================================= */}
      {/* REDIRECT ROUTES */}
      {/* ========================================= */}

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

// Main App Component
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        autoHideDuration={5000}
      >
        <AuthProvider>
          <Router>
            <Suspense fallback={<LoadingFallback message="Loading PropVantage AI..." />}>
              <AppRoutes />
            </Suspense>
          </Router>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;

/* 
========================================
ROUTING ARCHITECTURE SUMMARY
========================================

VILLA PROJECT FLOW:
Projects → Project Detail → Villa Units → Villa Unit Detail
URL: /projects/:id/units/:unitId

TOWER PROJECT FLOW:  
Projects → Project Detail → Towers → Tower Detail → Units → Unit Detail
URL: /projects/:id/towers/:towerId/units/:unitId

HYBRID PROJECT FLOW:
Projects → Project Detail → (Towers Tab + Villas Tab)
├── Towers → Tower Detail → Units → Unit Detail
└── Villas → Villa Unit Detail

EDIT/DELETE FUNCTIONALITY:
✅ Edit Project: /projects/:projectId/edit
✅ Edit Tower: /projects/:projectId/towers/:towerId/edit
✅ Edit Tower Unit: /projects/:projectId/towers/:towerId/units/:unitId/edit
✅ Edit Villa Unit: /projects/:projectId/units/:unitId/edit

SUPPORTED OPERATIONS:
✅ Villa Projects: Create/View/Edit villa units directly under project
✅ Tower Projects: Create/View/Edit towers and their units
✅ Hybrid Projects: Both villa and tower units in same project
✅ Universal CreateUnitPage: Adapts based on towerId presence
✅ Universal EditUnitPage: Adapts based on towerId presence
✅ Smart navigation: Breadcrumbs adapt to project type
✅ Role-based access: Proper permissions throughout
✅ Safety validations: Cannot delete sold units or towers with units
✅ Confirmation dialogs: Must type exact name to confirm deletion

ROUTE PROTECTION LEVELS:
- View Access: viewAllProjects() function
- Management Access: "MANAGEMENT" string  
- Sales Access: "SALES" string
- Finance Access: "FINANCE" string
- Admin Access: "ADMIN" string

CRITICAL ROUTE ORDER:
1. /projects/:projectId/edit (Project editing)
2. /projects/:projectId/towers/create (BEFORE tower detail)
3. /projects/:projectId/towers/:towerId/edit (Tower editing)
4. /projects/:projectId/units/create (Villa units)
5. /projects/:projectId/units/:unitId/edit (Villa unit editing)
6. /projects/:projectId/towers/:towerId/units/create (Tower units)
7. /projects/:projectId/towers/:towerId/units/:unitId/edit (Tower unit editing)
8. All specific routes BEFORE dynamic routes

EDIT FUNCTIONALITY FEATURES:
✅ Complete form validation with business logic
✅ Confirmation dialogs with name verification
✅ Impact warnings (sold units, towers with units)
✅ Real-time calculations (capacity, price per sq ft)
✅ Professional stepper forms for complex data
✅ Accordion sections for organized editing
✅ Success feedback with auto-redirect
✅ Breadcrumb navigation throughout hierarchy
✅ Loading states and error handling
✅ Backend integration with all CRUD operations
*/
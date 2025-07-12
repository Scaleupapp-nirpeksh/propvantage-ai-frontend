// File: src/App.js
// Description: Main App component with routing, theme, and authentication setup for PropVantage AI
// Version: 1.5 - Added Payment Dashboard and complete Payment Management routes
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
const EditLeadPage = React.lazy(() => import('./pages/leads/EditLeadPage')); // Added EditLeadPage
const LeadsPipelinePage = React.lazy(() => import('./pages/leads/LeadsPipelinePage'));

// Sales Management Pages
const SalesListPage = React.lazy(() => import('./pages/sales/SalesListPage'));
const SaleDetailPage = React.lazy(() => import('./pages/sales/SaleDetailPage'));
const CreateSalePage = React.lazy(() => import('./pages/sales/CreateSalePage'));
const EditSalePage = React.lazy(() => import('./pages/sales/EditSalePage')); // Added EditSalePage
const PaymentPlanManagementPage = React.lazy(() => import('./pages/payments/PaymentPlanManagementPage'));
const PaymentPlanPage = React.lazy(() => import('./pages/payments/PaymentPlanPage'));

const SalesReportsPage = React.lazy(() => import('./pages/sales/SalesReportsPage'));
const SalesPipelinePage = React.lazy(() => import('./pages/sales/SalesPipelinePage'));

// Commission Management Pages
const CommissionDashboardPage = React.lazy(() => import('./pages/sales/CommissionDashboardPage'));
const CommissionListPage = React.lazy(() => import('./pages/sales/CommissionListPage'));
const CommissionDetailPage = React.lazy(() => import('./pages/sales/CommissionDetailPage'));
const CommissionStructurePage = React.lazy(() => import('./pages/sales/CommissionStructurePage'));
const CommissionPaymentsPage = React.lazy(() => import('./pages/sales/CommissionPaymentsPage'));
const CommissionReportsPage = React.lazy(() => import('./pages/sales/CommissionReportsPage'));

// NEW: Payment Management Pages
const PaymentDashboardPage = React.lazy(() => import('./pages/payments/PaymentDashboardPage'));
const DueTodayPage = React.lazy(() => import('./pages/payments/DueTodayPage'));
const OverduePaymentsPage = React.lazy(() => import('./pages/payments/OverduePaymentsPage'));
const CollectionPerformancePage = React.lazy(() => import('./pages/payments/CollectionPerformancePage'));
const PaymentReportsPage = React.lazy(() => import('./pages/payments/PaymentReportsPage'));
const RecordPaymentPage = React.lazy(() => import('./pages/payments/RecordPaymentPage'));

// Analytics Pages
const AnalyticsDashboard = React.lazy(() => import('./pages/analytics/AnalyticsDashboard'));
const SalesAnalytics = React.lazy(() => import('./pages/analytics/SalesAnalytics'));
const RevenueAnalytics = React.lazy(() => import('./pages/analytics/RevenueAnalytics'));
const LeadAnalytics = React.lazy(() => import('./pages/analytics/LeadAnalytics'));

const InvoiceListPage = React.lazy(() => import('./pages/sales/InvoiceListPage'));
const InvoiceDetailPage = React.lazy(() => import('./pages/sales/InvoiceDetailPage'));
const GenerateInvoicePage = React.lazy(() => import('./pages/sales/GenerateInvoicePage'));


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
      {/* ========================================= */}

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

      <Route path="/projects/:projectId/edit" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading project editor..." />}>
              <EditProjectPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/projects/:projectId/towers/:towerId/edit" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading tower editor..." />}>
              <EditTowerPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/projects/:projectId/towers/:towerId/units/:unitId/edit" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading unit editor..." />}>
              <EditUnitPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/projects/:projectId/units/:unitId/edit" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading villa editor..." />}>
              <EditUnitPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/projects/:projectId/units/create" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <CreateUnitPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/projects/:projectId/units/:unitId" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewAllProjects()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <UnitDetailPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/projects/:projectId/towers/create" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <CreateTowerPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/projects/:projectId/towers/:towerId" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewAllProjects()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <TowerDetailPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/projects/:projectId/towers/:towerId/units/create" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback />}>
              <CreateUnitPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

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
      
      {/* ADDED: Edit Lead Page Route */}
      <Route path="/leads/:leadId/edit" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading lead editor..." />}>
              <EditLeadPage />
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

      <Route path="/sales/:saleId/edit" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading sale editor..." />}>
              <EditSalePage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />


            {/* Invoice List - Main invoice management page */}
            <Route path="/sales/invoices" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline() || canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading invoices..." />}>
              <InvoiceListPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Generate Invoice from Sale */}
      <Route path="/sales/invoices/generate/:saleId" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading invoice generator..." />}>
              <GenerateInvoicePage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      


      {/* Invoice Detail - Must be last to avoid route conflicts */}
      <Route path="/sales/invoices/:invoiceId" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline() || canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading invoice details..." />}>
              <InvoiceDetailPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Main Payment Plan Template Management */}
      <Route path="/sales/payment-plans" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading payment plan templates..." />}>
              <PaymentPlanManagementPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/payments/plans/:saleId" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading payment plan..." />}>
              <PaymentPlanPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Sales Pipeline Route */}
      <Route path="/sales/pipeline" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading sales pipeline..." />}>
              <SalesPipelinePage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Sales Reports Route */}
      <Route path="/sales/reports" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesReports()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading sales reports..." />}>
              <SalesReportsPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ========================================= */}
      {/* COMMISSION MANAGEMENT ROUTES */}
      {/* ========================================= */}

      {/* Commission Dashboard */}
      <Route path="/sales/commissions" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission dashboard..." />}>
              <CommissionDashboardPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Commission List */}
      <Route path="/sales/commissions/list" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission list..." />}>
              <CommissionListPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Commission Detail */}
      <Route path="/sales/commissions/list/:commissionId" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission details..." />}>
              <CommissionDetailPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Commission Edit (if you implement it later) */}
      <Route path="/sales/commissions/list/:commissionId/edit" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.projectManagement()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission editor..." />}>
              <CommissionDetailPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Commission Structures Management */}
      <Route path="/sales/commissions/structures" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.projectManagement()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission structures..." />}>
              <CommissionStructurePage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Commission Payments */}
      <Route path="/sales/commissions/payments" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission payments..." />}>
              <CommissionPaymentsPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Commission Payment for Specific Commission */}
      <Route path="/sales/commissions/payments/:commissionId" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission payment..." />}>
              <CommissionPaymentsPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Commission Reports */}
      <Route path="/sales/commissions/reports" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesReports()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission reports..." />}>
              <CommissionReportsPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ========================================= */}
      {/* NEW: PAYMENT MANAGEMENT ROUTES */}
      {/* ========================================= */}

      {/* Payment Dashboard - Main dashboard for payment overview */}
      <Route path="/payments/dashboard" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline() || canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading payment dashboard..." />}>
              <PaymentDashboardPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Fallback route - redirect /payments to /payments/dashboard */}
      <Route path="/payments" element={<Navigate to="/payments/dashboard" replace />} />

      {/* Due Today - Show all payments due today */}
      <Route path="/payments/due-today" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading due payments..." />}>
              <DueTodayPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Overdue Payments - Show all overdue payments */}
      <Route path="/payments/overdue" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading overdue payments..." />}>
              <OverduePaymentsPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Collection Performance - Analytics and performance metrics */}
      <Route path="/payments/collections" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading collection performance..." />}>
              <CollectionPerformancePage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Payment Reports - Generate and view payment reports */}
      <Route path="/payments/reports" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesReports()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading payment reports..." />}>
              <PaymentReportsPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Record Payment - General payment recording interface */}
      <Route path="/payments/record" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading payment recorder..." />}>
              <RecordPaymentPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Record Payment for Specific Sale */}
      <Route path="/payments/plans/:saleId/record-payment" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading payment recorder..." />}>
              <RecordPaymentPage />
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
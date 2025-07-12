// File: src/App.js
// Description: Main App component with routing, theme, and authentication setup for PropVantage AI
// Version: 1.6 - ENHANCED for Phase 1 Analytics Implementation (ADDITIVE ONLY)
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

// Auth Pages - UNCHANGED
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Dashboard Pages (Lazy loaded for performance) - UNCHANGED
const BusinessHeadDashboard = React.lazy(() => import('./pages/dashboard/BusinessHeadDashboard'));
const SalesExecutiveDashboard = React.lazy(() => import('./pages/dashboard/SalesExecutiveDashboard'));
const SalesManagerDashboard = React.lazy(() => import('./pages/dashboard/SalesManagerDashboard'));
const FinanceHeadDashboard = React.lazy(() => import('./pages/dashboard/FinanceHeadDashboard'));
const ProjectDirectorDashboard = React.lazy(() => import('./pages/dashboard/ProjectDirectorDashboard'));

// Project Management Pages - UNCHANGED
const ProjectsListPage = React.lazy(() => import('./pages/projects/ProjectsListPage'));
const ProjectDetailPage = React.lazy(() => import('./pages/projects/ProjectDetailPage'));
const TowerDetailPage = React.lazy(() => import('./pages/projects/TowerDetailPage'));
const UnitDetailPage = React.lazy(() => import('./pages/projects/UnitDetailPage'));
const CreateProjectPage = React.lazy(() => import('./pages/projects/CreateProjectPage'));
const CreateTowerPage = React.lazy(() => import('./pages/projects/CreateTowerPage'));
const CreateUnitPage = React.lazy(() => import('./pages/projects/CreateUnitPage'));

// Edit Pages - Complete Edit/Delete Functionality - UNCHANGED
const EditProjectPage = React.lazy(() => import('./pages/projects/EditProjectPage'));
const EditTowerPage = React.lazy(() => import('./pages/projects/EditTowerPage'));
const EditUnitPage = React.lazy(() => import('./pages/projects/EditUnitPage'));

// Lead Management Pages - UNCHANGED
const LeadsListPage = React.lazy(() => import('./pages/leads/LeadsListPage'));
const LeadDetailPage = React.lazy(() => import('./pages/leads/LeadDetailPage'));
const CreateLeadPage = React.lazy(() => import('./pages/leads/CreateLeadPage'));
const EditLeadPage = React.lazy(() => import('./pages/leads/EditLeadPage'));
const LeadsPipelinePage = React.lazy(() => import('./pages/leads/LeadsPipelinePage'));

// Sales Management Pages - UNCHANGED
const SalesListPage = React.lazy(() => import('./pages/sales/SalesListPage'));
const SaleDetailPage = React.lazy(() => import('./pages/sales/SaleDetailPage'));
const CreateSalePage = React.lazy(() => import('./pages/sales/CreateSalePage'));
const EditSalePage = React.lazy(() => import('./pages/sales/EditSalePage'));
const PaymentPlanManagementPage = React.lazy(() => import('./pages/payments/PaymentPlanManagementPage'));
const PaymentPlanPage = React.lazy(() => import('./pages/payments/PaymentPlanPage'));

const SalesReportsPage = React.lazy(() => import('./pages/sales/SalesReportsPage'));
const SalesPipelinePage = React.lazy(() => import('./pages/sales/SalesPipelinePage'));

// Commission Management Pages - UNCHANGED
const CommissionDashboardPage = React.lazy(() => import('./pages/sales/CommissionDashboardPage'));
const CommissionListPage = React.lazy(() => import('./pages/sales/CommissionListPage'));
const CommissionDetailPage = React.lazy(() => import('./pages/sales/CommissionDetailPage'));
const CommissionStructurePage = React.lazy(() => import('./pages/sales/CommissionStructurePage'));
const CommissionPaymentsPage = React.lazy(() => import('./pages/sales/CommissionPaymentsPage'));
const CommissionReportsPage = React.lazy(() => import('./pages/sales/CommissionReportsPage'));

// Payment Management Pages - UNCHANGED
const PaymentDashboardPage = React.lazy(() => import('./pages/payments/PaymentDashboardPage'));
const DueTodayPage = React.lazy(() => import('./pages/payments/DueTodayPage'));
const OverduePaymentsPage = React.lazy(() => import('./pages/payments/OverduePaymentsPage'));
const CollectionPerformancePage = React.lazy(() => import('./pages/payments/CollectionPerformancePage'));
const PaymentReportsPage = React.lazy(() => import('./pages/payments/PaymentReportsPage'));
const RecordPaymentPage = React.lazy(() => import('./pages/payments/RecordPaymentPage'));

// =============================================================================
// ANALYTICS PAGES - EXISTING + NEW FOR PHASE 1
// =============================================================================

// EXISTING Analytics Pages - UNCHANGED
const AnalyticsDashboard = React.lazy(() => import('./pages/analytics/AnalyticsDashboard'));
const SalesAnalytics = React.lazy(() => import('./pages/analytics/SalesAnalytics'));
const RevenueAnalytics = React.lazy(() => import('./pages/analytics/RevenueAnalytics'));
const LeadAnalytics = React.lazy(() => import('./pages/analytics/LeadAnalytics'));

// NEW: Phase 1 Analytics Pages - ENHANCED ANALYTICS CAPABILITIES
const BudgetVsActualDashboard = React.lazy(() => import('./pages/analytics/BudgetVsActualDashboard'));
const RealTimeFinancialDashboard = React.lazy(() => import('./pages/analytics/RealTimeFinancialDashboard'));
const AnalyticsReportsCenter = React.lazy(() => import('./pages/analytics/AnalyticsReportsCenter'));
const KPIDashboard = React.lazy(() => import('./pages/analytics/KPIDashboard'));

// NEW: Phase 2 Preparation - AI & Intelligence Pages (to be implemented in Phase 2)
// These imports will be uncommented when Phase 2 components are created
// const AIInsightsDashboard = React.lazy(() => import('./pages/ai/AIInsightsDashboard'));
// const ConversationAnalytics = React.lazy(() => import('./pages/ai/ConversationAnalytics'));
// const PredictiveAnalytics = React.lazy(() => import('./pages/ai/PredictiveAnalytics'));
// const SmartRecommendations = React.lazy(() => import('./pages/ai/SmartRecommendations'));

// Invoice Management Pages - UNCHANGED
const InvoiceListPage = React.lazy(() => import('./pages/sales/InvoiceListPage'));
const InvoiceDetailPage = React.lazy(() => import('./pages/sales/InvoiceDetailPage'));
const GenerateInvoicePage = React.lazy(() => import('./pages/sales/GenerateInvoicePage'));

// Settings and Profile Pages - UNCHANGED
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage'));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage'));
const UserManagementPage = React.lazy(() => import('./pages/settings/UserManagementPage'));

// Error Pages - UNCHANGED
const NotFoundPage = React.lazy(() => import('./pages/error/NotFoundPage'));
const UnauthorizedPage = React.lazy(() => import('./pages/error/UnauthorizedPage'));

// =============================================================================
// LOADING COMPONENT - ENHANCED FOR PHASE 1
// =============================================================================

/**
 * Enhanced Loading Component with contextual messages for different sections
 * ENHANCED: Added specific loading messages for analytics components
 */
const LoadingFallback = ({ message = 'Loading...', section = null }) => (
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
      {section === 'analytics' ? 'Loading analytics dashboard...' : 
       section === 'budget' ? 'Loading financial data...' :
       section === 'realtime' ? 'Connecting to real-time data...' :
       message}
    </Typography>
  </Box>
);

// =============================================================================
// PROTECTED ROUTE COMPONENT - UNCHANGED
// =============================================================================

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

// =============================================================================
// ROLE-BASED DASHBOARD ROUTER - UNCHANGED
// =============================================================================

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

// =============================================================================
// PUBLIC ROUTE COMPONENT - UNCHANGED
// =============================================================================

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

// =============================================================================
// MAIN APP ROUTES COMPONENT - ENHANCED FOR PHASE 1
// =============================================================================

const AppRoutes = () => {
  return (
    <Routes>
      {/* ========================================= */}
      {/* PUBLIC ROUTES - UNCHANGED */}
      {/* ========================================= */}

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

      {/* ========================================= */}
      {/* PROTECTED DASHBOARD ROUTE - UNCHANGED */}
      {/* ========================================= */}

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
      {/* PROJECT MANAGEMENT ROUTES - UNCHANGED */}
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
      {/* LEAD MANAGEMENT ROUTES - UNCHANGED */}
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
      {/* SALES MANAGEMENT ROUTES - UNCHANGED */}
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

      {/* Invoice Management Routes - UNCHANGED */}
      <Route path="/sales/invoices" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline() || canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading invoices..." />}>
              <InvoiceListPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/sales/invoices/generate/:saleId" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading invoice generator..." />}>
              <GenerateInvoicePage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/sales/invoices/:invoiceId" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline() || canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading invoice details..." />}>
              <InvoiceDetailPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Payment Plan Management Routes - UNCHANGED */}
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

      {/* Sales Pipeline & Reports Routes - UNCHANGED */}
      <Route path="/sales/pipeline" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading sales pipeline..." />}>
              <SalesPipelinePage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

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
      {/* COMMISSION MANAGEMENT ROUTES - UNCHANGED */}
      {/* ========================================= */}

      <Route path="/sales/commissions" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission dashboard..." />}>
              <CommissionDashboardPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/sales/commissions/list" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission list..." />}>
              <CommissionListPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/sales/commissions/list/:commissionId" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission details..." />}>
              <CommissionDetailPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/sales/commissions/list/:commissionId/edit" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.projectManagement()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission editor..." />}>
              <CommissionDetailPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/sales/commissions/structures" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.projectManagement()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission structures..." />}>
              <CommissionStructurePage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/sales/commissions/payments" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission payments..." />}>
              <CommissionPaymentsPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/sales/commissions/payments/:commissionId" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading commission payment..." />}>
              <CommissionPaymentsPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

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
      {/* PAYMENT MANAGEMENT ROUTES - UNCHANGED */}
      {/* ========================================= */}

      <Route path="/payments/dashboard" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline() || canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading payment dashboard..." />}>
              <PaymentDashboardPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/payments" element={<Navigate to="/payments/dashboard" replace />} />

      <Route path="/payments/due-today" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading due payments..." />}>
              <DueTodayPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/payments/overdue" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading overdue payments..." />}>
              <OverduePaymentsPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/payments/collections" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading collection performance..." />}>
              <CollectionPerformancePage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/payments/reports" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesReports()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading payment reports..." />}>
              <PaymentReportsPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/payments/record" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesPipeline()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback message="Loading payment recorder..." />}>
              <RecordPaymentPage />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

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
      {/* ANALYTICS ROUTES - ENHANCED FOR PHASE 1 */}
      {/* ========================================= */}

      {/* EXISTING Analytics Routes - UNCHANGED */}
      <Route path="/analytics" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback section="analytics" />}>
              <AnalyticsDashboard />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/analytics/sales" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback section="analytics" />}>
              <SalesAnalytics />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/analytics/revenue" element={
        <ProtectedRoute requiredPermission="FINANCE">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback section="analytics" />}>
              <RevenueAnalytics />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/analytics/leads" element={
        <ProtectedRoute requiredPermission="SALES">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback section="analytics" />}>
              <LeadAnalytics />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* NEW: Phase 1 Enhanced Analytics Routes */}
      
      {/* Budget vs Actual Dashboard - NEW for Phase 1 */}
      <Route path="/analytics/budget" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback section="budget" message="Loading budget analysis..." />}>
              <BudgetVsActualDashboard />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Real-Time Financial Dashboard - NEW for Phase 1 */}
      <Route path="/analytics/financial" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback section="realtime" message="Loading real-time financial data..." />}>
              <RealTimeFinancialDashboard />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Analytics Reports Center - NEW for Phase 1 */}
      <Route path="/analytics/reports" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.salesReports()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback section="analytics" message="Loading reports center..." />}>
              <AnalyticsReportsCenter />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* KPI Dashboard - NEW for Phase 1 */}
      <Route path="/analytics/kpis" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback section="analytics" message="Loading KPI dashboard..." />}>
              <KPIDashboard />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Enhanced Budget Analysis Routes - NEW for Phase 1 */}
      <Route path="/analytics/budget/variance" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback section="budget" message="Loading variance analysis..." />}>
              <BudgetVsActualDashboard />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/analytics/budget/projects" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.viewFinancials()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback section="budget" message="Loading project budget analysis..." />}>
              <BudgetVsActualDashboard />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ========================================= */}
      {/* PHASE 2 PREPARATION - AI ROUTES (COMMENTED OUT) */}
      {/* ========================================= */}

      {/* 
      These routes will be uncommented in Phase 2 when AI components are implemented
      
      <Route path="/ai-insights" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.leadManagement()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback section="ai" message="Loading AI insights..." />}>
              <AIInsightsDashboard />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/ai-insights/conversation" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.leadManagement()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback section="ai" message="Loading conversation analysis..." />}>
              <ConversationAnalytics />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/ai-insights/predictions" element={
        <ProtectedRoute requiredPermission="MANAGEMENT">
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback section="ai" message="Loading predictive analytics..." />}>
              <PredictiveAnalytics />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/ai-insights/recommendations" element={
        <ProtectedRoute requiredPermission={(canAccess) => canAccess.leadManagement()}>
          <DashboardLayout>
            <Suspense fallback={<LoadingFallback section="ai" message="Loading smart recommendations..." />}>
              <SmartRecommendations />
            </Suspense>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      */}

      {/* ========================================= */}
      {/* PROFILE AND SETTINGS ROUTES - UNCHANGED */}
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
      {/* ERROR ROUTES - UNCHANGED */}
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
      {/* REDIRECT ROUTES - UNCHANGED */}
      {/* ========================================= */}

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

// =============================================================================
// MAIN APP COMPONENT - UNCHANGED
// =============================================================================

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
//src/App.jsx
import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import useAuthStore from './store/authStore'
import useAppStore from './store/appStore'

// Import pages (we'll create these next)
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardLayout from './components/layout/DashboardLayout'

// Import dashboard pages
import DashboardHome from './pages/dashboard/DashboardHome'
import ProjectsPage from './pages/projects/ProjectsPage'
import ProjectDetailsPage from './pages/projects/ProjectDetailsPage'
import LeadsPage from './pages/leads/LeadsPage'
import LeadDetailsPage from './pages/leads/LeadDetailsPage'
import UnitsPage from './pages/units/UnitsPage'
import TowersPage from './pages/towers/TowersPage'
import PaymentsPage from './pages/payments/PaymentsPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'

function App() {
  const { isAuthenticated, user, initializeAuth } = useAuthStore()
  const { setPageLoading } = useAppStore()

  // Initialize authentication state on app load
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Show loading spinner while checking authentication
  if (user === null && localStorage.getItem('propvantage_token')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Loading PropVantage AI..." />
      </div>
    )
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes - Authentication */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <RegisterPage />
            )
          }
        />

        {/* Protected Routes - Dashboard */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <Routes>
                  {/* Dashboard Home */}
                  <Route path="/dashboard" element={<DashboardHome />} />
                  
                  {/* Projects Routes */}
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailsPage />} />
                  
                  {/* Towers Routes */}
                  <Route path="/towers" element={<TowersPage />} />
                  
                  {/* Units Routes */}
                  <Route path="/units" element={<UnitsPage />} />
                  
                  {/* Leads Routes */}
                  <Route path="/leads" element={<LeadsPage />} />
                  <Route path="/leads/:id" element={<LeadDetailsPage />} />
                  
                  {/* Payments Routes */}
                  <Route path="/payments" element={<PaymentsPage />} />
                  
                  {/* Reports Routes */}
                  <Route path="/reports" element={<ReportsPage />} />
                  
                  {/* Settings Routes */}
                  <Route path="/settings" element={<SettingsPage />} />
                  
                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  {/* 404 Page */}
                  <Route 
                    path="*" 
                    element={
                      <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                          <p className="text-lg text-gray-600 mb-8">Page not found</p>
                          <a href="/dashboard" className="text-blue-600 hover:text-blue-700">
                            Go back to Dashboard
                          </a>
                        </div>
                      </div>
                    } 
                  />
                </Routes>
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  )
}

export default App
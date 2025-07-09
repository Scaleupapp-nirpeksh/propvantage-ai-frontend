//src/services/api.js
import axios from 'axios'

// Base API URL - adjust this to match your backend
const BASE_URL = 'http://localhost:3000/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('propvantage_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('propvantage_token')
      localStorage.removeItem('propvantage_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// =============================================================================
// AUTH ENDPOINTS
// =============================================================================

export const authAPI = {
  // Register new organization
  register: (data) => api.post('/auth/register', data),
  
  // Login user
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Get current user profile
  getProfile: () => api.get('/auth/profile'),
  
  // Update profile
  updateProfile: (data) => api.put('/auth/profile', data),
  
  // Change password
  changePassword: (data) => api.put('/auth/change-password', data),
  
  // Forgot password
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  // Reset password
  resetPassword: (data) => api.post('/auth/reset-password', data),
}

// =============================================================================
// USER MANAGEMENT ENDPOINTS
// =============================================================================

export const userAPI = {
  // Get all users in organization
  getUsers: () => api.get('/users'),
  
  // Invite new user
  inviteUser: (data) => api.post('/users/invite', data),
  
  // Update user
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  
  // Delete user
  deleteUser: (id) => api.delete(`/users/${id}`),
}

// =============================================================================
// PROJECT MANAGEMENT ENDPOINTS
// =============================================================================

export const projectAPI = {
  // Get all projects
  getProjects: (params) => api.get('/projects', { params }),
  
  // Get single project
  getProject: (id) => api.get(`/projects/${id}`),
  
  // Create project
  createProject: (data) => api.post('/projects', data),
  
  // Update project
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  
  // Delete project
  deleteProject: (id) => api.delete(`/projects/${id}`),
  
  // Get project analytics
  getProjectAnalytics: (id) => api.get(`/projects/${id}/analytics`),
  
  // Get project payment configuration
  getPaymentConfig: (id) => api.get(`/projects/${id}/payment-config`),
  
  // Update project payment configuration
  updatePaymentConfig: (id, data) => api.put(`/projects/${id}/payment-config`, data),
}

// =============================================================================
// TOWER MANAGEMENT ENDPOINTS
// =============================================================================

export const towerAPI = {
  // Get all towers
  getTowers: (params) => api.get('/towers', { params }),
  
  // Get single tower
  getTower: (id) => api.get(`/towers/${id}`),
  
  // Create tower
  createTower: (data) => api.post('/towers', data),
  
  // Update tower
  updateTower: (id, data) => api.put(`/towers/${id}`, data),
  
  // Delete tower
  deleteTower: (id) => api.delete(`/towers/${id}`),
  
  // Get tower analytics
  getTowerAnalytics: (id) => api.get(`/towers/${id}/analytics`),
  
  // Bulk create units in tower
  bulkCreateUnits: (id, data) => api.post(`/towers/${id}/units/bulk-create`, data),
}

// =============================================================================
// UNIT MANAGEMENT ENDPOINTS
// =============================================================================

export const unitAPI = {
  // Get all units
  getUnits: (params) => api.get('/units', { params }),
  
  // Get single unit
  getUnit: (id) => api.get(`/units/${id}`),
  
  // Create unit
  createUnit: (data) => api.post('/units', data),
  
  // Update unit
  updateUnit: (id, data) => api.put(`/units/${id}`, data),
  
  // Delete unit
  deleteUnit: (id) => api.delete(`/units/${id}`),
  
  // Bulk update units
  bulkUpdateUnits: (data) => api.put('/units/bulk-update', data),
  
  // Get unit availability
  getAvailability: (params) => api.get('/units/availability', { params }),
}

// =============================================================================
// LEAD MANAGEMENT ENDPOINTS
// =============================================================================

export const leadAPI = {
  // Get all leads
  getLeads: (params) => api.get('/leads', { params }),
  
  // Get single lead
  getLead: (id) => api.get(`/leads/${id}`),
  
  // Create lead
  createLead: (data) => api.post('/leads', data),
  
  // Update lead
  updateLead: (id, data) => api.put(`/leads/${id}`, data),
  
  // Delete lead
  deleteLead: (id) => api.delete(`/leads/${id}`),
  
  // Assign lead
  assignLead: (id, data) => api.put(`/leads/${id}/assign`, data),
  
  // Bulk update leads
  bulkUpdateLeads: (data) => api.put('/leads/bulk-update', data),
  
  // Get lead interactions
  getInteractions: (id, params) => api.get(`/leads/${id}/interactions`, { params }),
  
  // Add interaction
  addInteraction: (id, data) => api.post(`/leads/${id}/interactions`, data),
  
  // Get AI insights for lead
  getAIInsights: (id) => api.get(`/ai/leads/${id}/insights`),
  
  // Get follow-up recommendations
  getFollowUpRecommendations: (id) => api.get(`/ai/leads/${id}/follow-up-recommendations`),
}

// =============================================================================
// SALES MANAGEMENT ENDPOINTS
// =============================================================================

export const salesAPI = {
  // Get all sales
  getSales: (params) => api.get('/sales', { params }),
  
  // Get single sale
  getSale: (id) => api.get(`/sales/${id}`),
  
  // Create sale
  createSale: (data) => api.post('/sales', data),
  
  // Update sale
  updateSale: (id, data) => api.put(`/sales/${id}`, data),
  
  // Cancel sale
  cancelSale: (id, data) => api.put(`/sales/${id}/cancel`, data),
}

// =============================================================================
// PAYMENT MANAGEMENT ENDPOINTS
// =============================================================================

export const paymentAPI = {
  // Get payment plans
  getPaymentPlans: (params) => api.get('/payments/plans', { params }),
  
  // Get payment plan details
  getPaymentPlan: (id) => api.get(`/payments/plans/${id}`),
  
  // Create payment plan
  createPaymentPlan: (data) => api.post('/payments/plans', data),
  
  // Update payment plan
  updatePaymentPlan: (id, data) => api.put(`/payments/plans/${id}`, data),
  
  // Get installments
  getInstallments: (params) => api.get('/payments/installments', { params }),
  
  // Update installment
  updateInstallment: (id, data) => api.put(`/payments/installments/${id}`, data),
  
  // Record payment
  recordPayment: (data) => api.post('/payments/transactions', data),
  
  // Get payment transactions
  getTransactions: (planId) => api.get(`/payments/transactions/${planId}`),
  
  // Get overdue payments
  getOverduePayments: () => api.get('/payments/reports/overdue'),
  
  // Get payments due today
  getPaymentsDueToday: () => api.get('/payments/reports/due-today'),
  
  // Get payment statistics
  getPaymentStatistics: (params) => api.get('/payments/reports/statistics', { params }),
}

// =============================================================================
// ANALYTICS ENDPOINTS
// =============================================================================

export const analyticsAPI = {
  // Get dashboard analytics
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  
  // Get sales forecasting
  getSalesForecast: (params) => api.get('/analytics/predictions/sales-forecast', { params }),
  
  // Get revenue projections
  getRevenueProjection: (params) => api.get('/analytics/predictions/revenue-projection', { params }),
  
  // Get lead conversion probability
  getLeadConversionProbability: (params) => api.get('/analytics/predictions/lead-conversion-probability', { params }),
  
  // Get inventory turnover
  getInventoryTurnover: (params) => api.get('/analytics/predictions/inventory-turnover', { params }),
  
  // Get budget vs actual
  getBudgetVsActual: (params) => api.get('/analytics/budget-vs-actual', { params }),
}

// =============================================================================
// CONSTRUCTION MANAGEMENT ENDPOINTS  
// =============================================================================

export const constructionAPI = {
  // Get milestones
  getMilestones: (params) => api.get('/construction/milestones', { params }),
  
  // Get single milestone
  getMilestone: (id) => api.get(`/construction/milestones/${id}`),
  
  // Create milestone
  createMilestone: (data) => api.post('/construction/milestones', data),
  
  // Update milestone
  updateMilestone: (id, data) => api.put(`/construction/milestones/${id}`, data),
  
  // Get overdue milestones
  getOverdueMilestones: () => api.get('/construction/milestones/overdue'),
  
  // Get project timeline
  getProjectTimeline: (id) => api.get(`/construction/projects/${id}/timeline`),
}

// =============================================================================
// PRICING ENDPOINTS
// =============================================================================

export const pricingAPI = {
  // Generate cost sheet
  getCostSheet: (unitId, data) => api.post(`/pricing/cost-sheet/${unitId}`, data),
  
  // Get dynamic pricing
  getDynamicPricing: (projectId) => api.get(`/pricing/dynamic/${projectId}`),
}

// Default export for convenience
export default api
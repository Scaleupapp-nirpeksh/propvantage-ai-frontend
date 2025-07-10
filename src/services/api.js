// File: src/services/api.js
// Description: Complete API service configuration for PropVantage AI - Covers all 22+ backend routes
// Version: 1.0 - Comprehensive API client with authentication and error handling
// Location: src/services/api.js

import axios from 'axios';

// Base API configuration
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

// =============================================================================
// 1. AUTHENTICATION SERVICES (/api/auth)
// =============================================================================
export const authAPI = {
  // Register new organization and admin user
  register: (organizationData) => api.post('/auth/register', organizationData),
  
  // Login user
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Refresh token
  refresh: () => api.post('/auth/refresh'),
  
  // Logout user
  logout: () => api.post('/auth/logout'),
  
  // Forgot password
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  
  // Reset password
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  
  // Verify email
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
};

// =============================================================================
// 2. USER MANAGEMENT SERVICES (/api/users)
// =============================================================================
export const userAPI = {
  // Get all users in organization
  getUsers: (params = {}) => api.get('/users', { params }),
  
  // Get user by ID
  getUser: (id) => api.get(`/users/${id}`),
  
  // Update user profile
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  
  // Delete user
  deleteUser: (id) => api.delete(`/users/${id}`),
  
  // Invite new user
  inviteUser: (inviteData) => api.post('/users/invite', inviteData),
  
  // Get current user profile
  getProfile: () => api.get('/users/profile'),
  
  // Update current user profile
  updateProfile: (userData) => api.put('/users/profile', userData),
  
  // Change password
  changePassword: (passwordData) => api.put('/users/change-password', passwordData),
};

// =============================================================================
// 3. PROJECT MANAGEMENT SERVICES (/api/projects)
// =============================================================================
export const projectAPI = {
  // Get all projects
  getProjects: (params = {}) => api.get('/projects', { params }),
  
  // Get project by ID
  getProject: (id) => api.get(`/projects/${id}`),
  
  // Create new project
  createProject: (projectData) => api.post('/projects', projectData),
  
  // Update project
  updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
  
  // Delete project
  deleteProject: (id) => api.delete(`/projects/${id}`),
  
  // Get project analytics
  getProjectAnalytics: (id) => api.get(`/projects/${id}/analytics`),
  
  // Get project dashboard
  getProjectDashboard: (id) => api.get(`/projects/${id}/dashboard`),
  
  // Project payment configuration
  getPaymentConfig: (id) => api.get(`/projects/${id}/payment-config`),
  updatePaymentConfig: (id, configData) => api.put(`/projects/${id}/payment-config`, configData),
  
  // Get project timeline
  getProjectTimeline: (id) => api.get(`/projects/${id}/timeline`),
};

// =============================================================================
// 4. TOWER MANAGEMENT SERVICES (/api/towers)
// =============================================================================
export const towerAPI = {
  // Get all towers
  getTowers: (params = {}) => api.get('/towers', { params }),
  
  // Get tower by ID
  getTower: (id) => api.get(`/towers/${id}`),
  
  // Create new tower
  createTower: (towerData) => api.post('/towers', towerData),
  
  // Update tower
  updateTower: (id, towerData) => api.put(`/towers/${id}`, towerData),
  
  // Delete tower
  deleteTower: (id) => api.delete(`/towers/${id}`),
  
  // Get tower analytics
  getTowerAnalytics: (id) => api.get(`/towers/${id}/analytics`),
  
  // Bulk create units for tower
  bulkCreateUnits: (id, unitsData) => api.post(`/towers/${id}/units/bulk-create`, unitsData),
};

// =============================================================================
// 5. UNIT MANAGEMENT SERVICES (/api/units)
// =============================================================================
export const unitAPI = {
  // Get all units
  getUnits: (params = {}) => api.get('/units', { params }),
  
  // Get unit by ID
  getUnit: (id) => api.get(`/units/${id}`),
  
  // Create new unit
  createUnit: (unitData) => api.post('/units', unitData),
  
  // Update unit
  updateUnit: (id, unitData) => api.put(`/units/${id}`, unitData),
  
  // Delete unit
  deleteUnit: (id) => api.delete(`/units/${id}`),
  
  // Bulk update units
  bulkUpdateUnits: (updateData) => api.put('/units/bulk-update', updateData),
  
  // Get unit availability
  getUnitAvailability: (params = {}) => api.get('/units/availability', { params }),
  
  // Block/unblock unit
  toggleUnitBlock: (id, blockData) => api.put(`/units/${id}/block`, blockData),
};

// =============================================================================
// 6. LEAD MANAGEMENT SERVICES (/api/leads)
// =============================================================================
export const leadAPI = {
  // Get all leads
  getLeads: (params = {}) => api.get('/leads', { params }),
  
  // Get lead by ID
  getLead: (id) => api.get(`/leads/${id}`),
  
  // Create new lead
  createLead: (leadData) => api.post('/leads', leadData),
  
  // Update lead
  updateLead: (id, leadData) => api.put(`/leads/${id}`, leadData),
  
  // Delete lead
  deleteLead: (id) => api.delete(`/leads/${id}`),
  
  // Lead scoring endpoints
  getLeadScore: (id) => api.get(`/leads/${id}/score`),
  recalculateLeadScore: (id) => api.post(`/leads/${id}/score/recalculate`),
  getHighPriorityLeads: (params = {}) => api.get('/leads/high-priority', { params }),
  getLeadsNeedingAttention: (params = {}) => api.get('/leads/needs-attention', { params }),
  getScoreAnalytics: (params = {}) => api.get('/leads/score-analytics', { params }),
  bulkRecalculateScores: (leadIds) => api.post('/leads/score/bulk-recalculate', { leadIds }),
  getLeadScoreHistory: (id) => api.get(`/leads/${id}/score-history`),
  
  // Lead interactions
  addInteraction: (leadId, interactionData) => api.post(`/leads/${leadId}/interactions`, interactionData),
  getInteractions: (leadId) => api.get(`/leads/${leadId}/interactions`),
  
  // Lead assignment
  assignLead: (id, assignData) => api.put(`/leads/${id}/assign`, assignData),
  
  // Lead conversion
  convertLead: (id, conversionData) => api.post(`/leads/${id}/convert`, conversionData),
};

// =============================================================================
// 7. SALES MANAGEMENT SERVICES (/api/sales)
// =============================================================================
export const salesAPI = {
  // Get all sales
  getSales: (params = {}) => api.get('/sales', { params }),
  
  // Get sale by ID
  getSale: (id) => api.get(`/sales/${id}`),
  
  // Create new sale (booking)
  createSale: (saleData) => api.post('/sales', saleData),
  
  // Update sale
  updateSale: (id, saleData) => api.put(`/sales/${id}`, saleData),
  
  // Cancel sale
  cancelSale: (id, cancelData) => api.put(`/sales/${id}/cancel`, cancelData),
  
  // Get sales analytics
  getSalesAnalytics: (params = {}) => api.get('/sales/analytics', { params }),
  
  // Get sales pipeline
  getSalesPipeline: (params = {}) => api.get('/sales/pipeline', { params }),
  
  // Generate sale documents
  generateSaleDocuments: (id) => api.post(`/sales/${id}/documents`),
};

// =============================================================================
// 8. PRICING SERVICES (/api/pricing)
// =============================================================================
export const pricingAPI = {
  // Generate cost sheet for unit
  generateCostSheet: (unitId, costSheetData) => api.post(`/pricing/cost-sheet/${unitId}`, costSheetData),
  
  // Get dynamic pricing suggestions
  getDynamicPricing: (projectId) => api.get(`/pricing/dynamic/${projectId}`),
  
  // Update unit pricing
  updateUnitPricing: (unitId, pricingData) => api.put(`/pricing/units/${unitId}`, pricingData),
  
  // Bulk pricing updates
  bulkUpdatePricing: (pricingData) => api.put('/pricing/bulk-update', pricingData),
  
  // Get pricing analytics
  getPricingAnalytics: (params = {}) => api.get('/pricing/analytics', { params }),
  
  // Price comparison
  comparePricing: (comparisonData) => api.post('/pricing/compare', comparisonData),
};

// =============================================================================
// 9. AI INSIGHTS SERVICES (/api/ai)
// =============================================================================
export const aiAPI = {
  // Get AI insights for lead
  getLeadInsights: (leadId) => api.get(`/ai/leads/${leadId}/insights`),
  
  // Get AI recommendations
  getRecommendations: (leadId) => api.get(`/ai/leads/${leadId}/recommendations`),
  
  // AI objection handling
  getObjectionHandling: (objectionData) => api.post('/ai/objection-handling', objectionData),
  
  // AI market analysis
  getMarketAnalysis: (analysisData) => api.post('/ai/market-analysis', analysisData),
  
  // AI pricing suggestions
  getPricingSuggestions: (pricingData) => api.post('/ai/pricing-suggestions', pricingData),
};

// =============================================================================
// 10. AI CONVERSATION SERVICES (/api/ai/conversation)
// =============================================================================
export const aiConversationAPI = {
  // Analyze conversation
  analyzeConversation: (conversationData) => api.post('/ai/conversation/analyze', conversationData),
  
  // Get follow-up recommendations
  getFollowUpRecommendations: (recommendationData) => api.post('/ai/conversation/recommendations', recommendationData),
  
  // Get lead interaction patterns
  getInteractionPatterns: (leadId) => api.get(`/ai/conversation/leads/${leadId}/interaction-patterns`),
  
  // Get conversation summary
  getConversationSummary: (leadId) => api.get(`/ai/conversation/leads/${leadId}/conversation-summary`),
  
  // Bulk conversation analysis
  bulkAnalyzeConversations: (conversationsData) => api.post('/ai/conversation/bulk-analyze', conversationsData),
  
  // Get lead temperature prediction
  getLeadTemperature: (leadId) => api.get(`/ai/conversation/leads/${leadId}/temperature`),
};

// =============================================================================
// 11. FILE MANAGEMENT SERVICES (/api/files)
// =============================================================================
export const fileAPI = {
  // Upload file
  uploadFile: (fileData) => {
    const formData = new FormData();
    formData.append('file', fileData);
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Get file by ID
  getFile: (id) => api.get(`/files/${id}`),
  
  // Delete file
  deleteFile: (id) => api.delete(`/files/${id}`),
  
  // Get files list
  getFiles: (params = {}) => api.get('/files', { params }),
  
  // Generate file preview
  getFilePreview: (id) => api.get(`/files/${id}/preview`),
};

// =============================================================================
// 12. ANALYTICS SERVICES (/api/analytics)
// =============================================================================
export const analyticsAPI = {
  // Get dashboard analytics
  getDashboard: (params = {}) => api.get('/analytics/dashboard', { params }),
  
  // Get sales analytics
  getSalesAnalytics: (params = {}) => api.get('/analytics/sales', { params }),
  
  // Get revenue analytics
  getRevenueAnalytics: (params = {}) => api.get('/analytics/revenue', { params }),
  
  // Get project analytics
  getProjectAnalytics: (params = {}) => api.get('/analytics/projects', { params }),
  
  // Get lead analytics
  getLeadAnalytics: (params = {}) => api.get('/analytics/leads', { params }),
  
  // Get user performance analytics
  getUserPerformance: (params = {}) => api.get('/analytics/users', { params }),
  
  // Budget vs Actual analytics
  getBudgetVsActual: (params = {}) => api.get('/analytics/budget-vs-actual', { params }),
  getBudgetDashboard: (params = {}) => api.get('/analytics/budget-dashboard', { params }),
  getRevenueAnalysis: (params = {}) => api.get('/analytics/revenue-analysis', { params }),
  getLeadAnalysis: (params = {}) => api.get('/analytics/lead-analysis', { params }),
  getProjectComparison: (params = {}) => api.get('/analytics/project-comparison', { params }),
  getMarketingROI: (params = {}) => api.get('/analytics/marketing-roi', { params }),
};

// =============================================================================
// 13. PREDICTIVE ANALYTICS SERVICES (/api/analytics/predictions)
// =============================================================================
export const predictiveAPI = {
  // Sales forecasting
  getSalesForecast: (params = {}) => api.get('/analytics/predictions/sales-forecast', { params }),
  
  // Revenue projections
  getRevenueProjection: (params = {}) => api.get('/analytics/predictions/revenue-projection', { params }),
  
  // Lead conversion probability
  getLeadConversionProbability: (params = {}) => api.get('/analytics/predictions/lead-conversion-probability', { params }),
  
  // Inventory turnover analysis
  getInventoryTurnover: (params = {}) => api.get('/analytics/predictions/inventory-turnover', { params }),
  
  // Predictions dashboard
  getPredictionsDashboard: (params = {}) => api.get('/analytics/predictions/dashboard-summary', { params }),
  
  // Health check for predictions
  getPredictionsHealth: () => api.get('/analytics/predictions/health-check'),
};

// =============================================================================
// 14. PAYMENT SERVICES (/api/payments)
// =============================================================================
export const paymentAPI = {
  // Get all payments
  getPayments: (params = {}) => api.get('/payments', { params }),
  
  // Get payment by ID
  getPayment: (id) => api.get(`/payments/${id}`),
  
  // Create payment
  createPayment: (paymentData) => api.post('/payments', paymentData),
  
  // Update payment
  updatePayment: (id, paymentData) => api.put(`/payments/${id}`, paymentData),
  
  // Process payment
  processPayment: (id, processData) => api.post(`/payments/${id}/process`, processData),
  
  // Get payment schedule
  getPaymentSchedule: (saleId) => api.get(`/payments/schedule/${saleId}`),
  
  // Get overdue payments
  getOverduePayments: (params = {}) => api.get('/payments/overdue', { params }),
  
  // Generate payment reminder
  generatePaymentReminder: (paymentId) => api.post(`/payments/${paymentId}/reminder`),
};

// =============================================================================
// 15. COMMISSION SERVICES (/api/commissions)
// =============================================================================
export const commissionAPI = {
  // Get all commissions
  getCommissions: (params = {}) => api.get('/commissions', { params }),
  
  // Get commission by ID
  getCommission: (id) => api.get(`/commissions/${id}`),
  
  // Calculate commission
  calculateCommission: (calculationData) => api.post('/commissions/calculate', calculationData),
  
  // Process commission payment
  processCommissionPayment: (id, paymentData) => api.post(`/commissions/${id}/pay`, paymentData),
  
  // Get commission analytics
  getCommissionAnalytics: (params = {}) => api.get('/commissions/analytics', { params }),
  
  // Get user commissions
  getUserCommissions: (userId, params = {}) => api.get(`/commissions/user/${userId}`, { params }),
};

// =============================================================================
// 16. DOCUMENT SERVICES (/api/documents)
// =============================================================================
export const documentAPI = {
  // Get all documents
  getDocuments: (params = {}) => api.get('/documents', { params }),
  
  // Get document by ID
  getDocument: (id) => api.get(`/documents/${id}`),
  
  // Upload document
  uploadDocument: (documentData) => {
    const formData = new FormData();
    Object.keys(documentData).forEach(key => {
      formData.append(key, documentData[key]);
    });
    return api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Update document
  updateDocument: (id, documentData) => api.put(`/documents/${id}`, documentData),
  
  // Delete document
  deleteDocument: (id) => api.delete(`/documents/${id}`),
  
  // Get document categories
  getDocumentCategories: () => api.get('/documents/categories'),
  
  // Document approval workflows
  getPendingApprovals: (params = {}) => api.get('/documents/approvals/pending', { params }),
  approveDocument: (id, approvalData) => api.post(`/documents/${id}/approve`, approvalData),
  rejectDocument: (id, rejectionData) => api.post(`/documents/${id}/reject`, rejectionData),
  
  // Document templates
  getDocumentTemplates: () => api.get('/documents/templates'),
  generateFromTemplate: (templateId, templateData) => api.post(`/documents/templates/${templateId}/generate`, templateData),
};

// =============================================================================
// 17. CONSTRUCTION SERVICES (/api/construction)
// =============================================================================
export const constructionAPI = {
  // Milestones
  getMilestones: (params = {}) => api.get('/construction/milestones', { params }),
  getMilestone: (id) => api.get(`/construction/milestones/${id}`),
  createMilestone: (milestoneData) => api.post('/construction/milestones', milestoneData),
  updateMilestone: (id, milestoneData) => api.put(`/construction/milestones/${id}`, milestoneData),
  deleteMilestone: (id) => api.delete(`/construction/milestones/${id}`),
  getOverdueMilestones: (params = {}) => api.get('/construction/milestones/overdue', { params }),
  
  // Progress tracking
  updateMilestoneProgress: (id, progressData) => api.put(`/construction/milestones/${id}/progress`, progressData),
  
  // Quality control
  addQualityCheck: (milestoneId, qualityData) => api.post(`/construction/milestones/${milestoneId}/quality-checks`, qualityData),
  updateQualityCheck: (milestoneId, checkId, updateData) => api.put(`/construction/milestones/${milestoneId}/quality-checks/${checkId}`, updateData),
  
  // Issue management
  addIssue: (milestoneId, issueData) => api.post(`/construction/milestones/${milestoneId}/issues`, issueData),
  
  // Project timeline
  getProjectTimeline: (projectId) => api.get(`/construction/projects/${projectId}/timeline`),
};

// =============================================================================
// 18. CONTRACTOR SERVICES (/api/contractors)
// =============================================================================
export const contractorAPI = {
  // Get all contractors
  getContractors: (params = {}) => api.get('/contractors', { params }),
  
  // Get contractor by ID
  getContractor: (id) => api.get(`/contractors/${id}`),
  
  // Create new contractor
  createContractor: (contractorData) => api.post('/contractors', contractorData),
  
  // Update contractor
  updateContractor: (id, contractorData) => api.put(`/contractors/${id}`, contractorData),
  
  // Delete contractor
  deleteContractor: (id) => api.delete(`/contractors/${id}`),
  
  // Contractor documents
  uploadContractorDocument: (id, documentData) => {
    const formData = new FormData();
    formData.append('document', documentData);
    return api.post(`/contractors/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Contractor reviews
  addContractorReview: (id, reviewData) => api.post(`/contractors/${id}/reviews`, reviewData),
  
  // Contractor status management
  updateContractorStatus: (id, statusData) => api.put(`/contractors/${id}/status`, statusData),
  togglePreferredStatus: (id) => api.put(`/contractors/${id}/preferred`),
  
  // Internal notes
  addInternalNote: (id, noteData) => api.post(`/contractors/${id}/notes`, noteData),
};

// =============================================================================
// 19. SYSTEM SERVICES (Health, Performance, Docs)
// =============================================================================
export const systemAPI = {
  // Health check
  healthCheck: () => api.get('/health'),
  
  // API documentation
  getApiDocs: () => api.get('/docs'),
  
  // Performance monitoring
  getPerformanceMetrics: () => api.get('/performance'),
  
  // AI features information
  getAIFeatures: () => api.get('/ai-features'),
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Helper function to handle API errors
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
    return {
      success: false,
      message,
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Network error
    return {
      success: false,
      message: 'Network error. Please check your connection.',
      status: 0,
    };
  } else {
    // Other error
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
      status: 0,
    };
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Helper function to get current user
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Helper function to logout user
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Default export with all APIs
export default {
  auth: authAPI,
  user: userAPI,
  project: projectAPI,
  tower: towerAPI,
  unit: unitAPI,
  lead: leadAPI,
  sales: salesAPI,
  pricing: pricingAPI,
  ai: aiAPI,
  aiConversation: aiConversationAPI,
  file: fileAPI,
  analytics: analyticsAPI,
  predictive: predictiveAPI,
  payment: paymentAPI,
  commission: commissionAPI,
  document: documentAPI,
  construction: constructionAPI,
  contractor: contractorAPI,
  system: systemAPI,
};
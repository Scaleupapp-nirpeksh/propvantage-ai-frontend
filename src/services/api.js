// File: src/services/api.js
// Description: Complete API service configuration for PropVantage AI - Covers ALL backend routes
// Version: 2.0 - Fixed and comprehensive API client with all missing routes added
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
// 1. AUTHENTICATION SERVICES (/api/auth) - BASIC IMPLEMENTATION
// =============================================================================
export const authAPI = {
  // Register new organization and admin user
  register: (organizationData) => api.post('/auth/register', organizationData),
  
  // Login user
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Note: Backend only has register and login routes currently
  // These routes may need to be implemented on backend:
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
};

// =============================================================================
// 2. USER MANAGEMENT SERVICES (/api/users) - CORRECTED
// =============================================================================
export const userAPI = {
  // **CORRECTED**: Backend only has these routes, removed non-existent ones
  
  // Get all users in organization
  getUsers: (params = {}) => api.get('/users', { params }),
  
  // Update user by ID
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  
  // Invite new user
  inviteUser: (inviteData) => api.post('/users/invite', inviteData),
  
  // **REMOVED**: These routes don't exist in backend currently
  // getUser: (id) => api.get(`/users/${id}`),
  // deleteUser: (id) => api.delete(`/users/${id}`),
  // getProfile: () => api.get('/users/profile'),
  // updateProfile: (userData) => api.put('/users/profile', userData),
  // changePassword: (passwordData) => api.put('/users/change-password', passwordData),
};

// =============================================================================
// 3. PROJECT MANAGEMENT SERVICES (/api/projects) - CORRECTED
// =============================================================================
export const projectAPI = {
  // Basic CRUD operations (confirmed in backend)
  getProjects: (params = {}) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post('/projects', projectData),
  updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  
  // **REMOVED**: These routes don't exist in backend currently
  // getProjectAnalytics: (id) => api.get(`/projects/${id}/analytics`),
  // getProjectDashboard: (id) => api.get(`/projects/${id}/dashboard`),
  // getProjectTimeline: (id) => api.get(`/projects/${id}/timeline`),
};

// =============================================================================
// 4. **NEW**: PROJECT PAYMENT CONFIGURATION SERVICES (/api/projects)
// =============================================================================
export const projectPaymentAPI = {
  // Payment configuration for projects
  getPaymentConfig: (projectId) => api.get(`/projects/${projectId}/payment-config`),
  updatePaymentConfig: (projectId, configData) => api.put(`/projects/${projectId}/payment-config`, configData),
  
  // Payment plan templates
  getPaymentPlanTemplates: (projectId) => api.get(`/projects/${projectId}/payment-templates`),
  createPaymentPlanTemplate: (projectId, templateData) => api.post(`/projects/${projectId}/payment-templates`, templateData),
  updatePaymentPlanTemplate: (projectId, templateId, templateData) => api.put(`/projects/${projectId}/payment-templates/${templateId}`, templateData),
  deletePaymentPlanTemplate: (projectId, templateId) => api.delete(`/projects/${projectId}/payment-templates/${templateId}`),
};

// =============================================================================
// 5. TOWER MANAGEMENT SERVICES (/api/towers) - CONFIRMED CORRECT
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
// 6. UNIT MANAGEMENT SERVICES (/api/units) - CORRECTED AND ENHANCED
// =============================================================================
export const unitAPI = {
  // Get all units
  getUnits: (params = {}) => api.get('/units', { params }),
  
  // **NEW**: Get unit statistics (confirmed in backend)
  getUnitStatistics: (params = {}) => api.get('/units/statistics', { params }),
  
  // Get unit by ID
  getUnit: (id) => api.get(`/units/${id}`),
  
  // Create new unit
  createUnit: (unitData) => api.post('/units', unitData),
  
  // Update unit
  updateUnit: (id, unitData) => api.put(`/units/${id}`, unitData),
  
  // Delete unit
  deleteUnit: (id) => api.delete(`/units/${id}`),
  
  // **REMOVED**: These routes don't exist in backend currently
  // bulkUpdateUnits: (updateData) => api.put('/units/bulk-update', updateData),
  // getUnitAvailability: (params = {}) => api.get('/units/availability', { params }),
  // toggleUnitBlock: (id, blockData) => api.put(`/units/${id}/block`, blockData),
};

// =============================================================================
// 7. LEAD MANAGEMENT SERVICES (/api/leads) - CORRECTED AND ENHANCED
// =============================================================================
export const leadAPI = {
  // Basic CRUD operations
  getLeads: (params = {}) => api.get('/leads', { params }),
  getLead: (id) => api.get(`/leads/${id}`),
  createLead: (leadData) => api.post('/leads', leadData),
  updateLead: (id, leadData) => api.put(`/leads/${id}`, leadData),
  deleteLead: (id) => api.delete(`/leads/${id}`),
  
  // Lead interactions (confirmed in backend)
  addInteraction: (leadId, interactionData) => api.post(`/leads/${leadId}/interactions`, interactionData),
  getInteractions: (leadId) => api.get(`/leads/${leadId}/interactions`),
  
  // **ENHANCED**: Lead scoring endpoints (confirmed in backend)
  getLeadScore: (id) => api.get(`/leads/${id}/score`),
  recalculateLeadScore: (id) => api.put(`/leads/${id}/recalculate-score`), // **CORRECTED**: PUT method
  getHighPriorityLeads: (params = {}) => api.get('/leads/high-priority', { params }),
  getLeadsNeedingAttention: (params = {}) => api.get('/leads/needs-attention', { params }),
  getScoreAnalytics: (params = {}) => api.get('/leads/score-analytics', { params }),
  bulkRecalculateScores: (leadIds) => api.post('/leads/bulk-recalculate-scores', { leadIds }), // **CORRECTED**: endpoint name
  getLeadScoreHistory: (id) => api.get(`/leads/${id}/score-history`),
  
  // **NEW**: Scoring configuration (confirmed in backend)
  getScoringConfig: () => api.get('/leads/scoring-config'),
  updateScoringConfig: (configData) => api.put('/leads/scoring-config', configData),
  
  // **REMOVED**: These routes don't exist in backend currently
  // assignLead: (id, assignData) => api.put(`/leads/${id}/assign`, assignData),
  // convertLead: (id, conversionData) => api.post(`/leads/${id}/convert`, conversionData),
};

// =============================================================================
// 8. SALES MANAGEMENT SERVICES (/api/sales) - CONFIRMED CORRECT
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

  // Delete sale (maps to the DELETE /api/sales/:id route for cancellation)
  deleteSale: (id) => api.delete(`/sales/${id}`),

  // Get sales analytics (confirmed in backend)
  getSalesAnalytics: (params = {}) => api.get('/sales/analytics', { params }),

  // Get sales pipeline (confirmed in backend)
  getSalesPipeline: (params = {}) => api.get('/sales/pipeline', { params }),
  
  // **REMOVED**: This route doesn't exist in backend currently
  // generateSaleDocuments: (id) => api.post(`/sales/${id}/documents`),
};

// =============================================================================
// 9. PRICING SERVICES (/api/pricing) - CORRECTED
// =============================================================================
export const pricingAPI = {
  // **CORRECTED**: Backend routes are different from what was in original API.js
  
  // Generate cost sheet for unit (confirmed in backend)
  generateCostSheet: (unitId, costSheetData) => api.post(`/pricing/cost-sheet/${unitId}`, costSheetData),
  
  // Get dynamic pricing suggestions (confirmed in backend)
  getDynamicPricing: (projectId) => api.get(`/pricing/dynamic/${projectId}`),
  
  // **REMOVED**: These routes don't exist in backend currently
  // updateUnitPricing: (unitId, pricingData) => api.put(`/pricing/units/${unitId}`, pricingData),
  // bulkUpdatePricing: (pricingData) => api.put('/pricing/bulk-update', pricingData),
  // getPricingAnalytics: (params = {}) => api.get('/pricing/analytics', { params }),
  // comparePricing: (comparisonData) => api.post('/pricing/compare', comparisonData),
};

// =============================================================================
// 10. AI INSIGHTS SERVICES (/api/ai) - CORRECTED
// =============================================================================
export const aiAPI = {
  // **CORRECTED**: Backend only has lead insights route currently
  
  // Get AI insights for lead (confirmed in backend)
  getLeadInsights: (leadId) => api.get(`/ai/leads/${leadId}/insights`),
  
  // **REMOVED**: These routes don't exist in backend currently
  // getRecommendations: (leadId) => api.get(`/ai/leads/${leadId}/recommendations`),
  // getObjectionHandling: (objectionData) => api.post('/ai/objection-handling', objectionData),
  // getMarketAnalysis: (analysisData) => api.post('/ai/market-analysis', analysisData),
  // getPricingSuggestions: (pricingData) => api.post('/ai/pricing-suggestions', pricingData),
};

// =============================================================================
// 11. **REMOVED**: AI CONVERSATION SERVICES - NOT IMPLEMENTED IN BACKEND
// =============================================================================
// The aiConversationAPI section has been removed as these routes don't exist in the backend

// =============================================================================
// 12. FILE MANAGEMENT SERVICES (/api/files) - CORRECTED
// =============================================================================
export const fileAPI = {
  // **CORRECTED**: Backend has different routes than original API.js
  
  // Upload file (confirmed in backend)
  uploadFile: (fileData) => {
    const formData = new FormData();
    formData.append('file', fileData);
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Get files for a specific resource (confirmed in backend)
  getFilesForResource: (resourceId) => api.get(`/files/resource/${resourceId}`),
  
  // **REMOVED**: These routes don't exist in backend currently
  // getFile: (id) => api.get(`/files/${id}`),
  // deleteFile: (id) => api.delete(`/files/${id}`),
  // getFiles: (params = {}) => api.get('/files', { params }),
  // getFilePreview: (id) => api.get(`/files/${id}/preview`),
};

// =============================================================================
// 13. ANALYTICS SERVICES (/api/analytics) - CORRECTED AND ENHANCED
// =============================================================================
export const analyticsAPI = {
  // **CORRECTED**: Based on actual backend routes
  
  // Basic analytics (confirmed in backend)
  getSalesSummary: (params = {}) => api.get('/analytics/sales-summary', { params }),
  getLeadFunnel: (params = {}) => api.get('/analytics/lead-funnel', { params }),
  getDashboard: (params = {}) => api.get('/analytics/dashboard', { params }),
  getSalesReport: (params = {}) => api.get('/analytics/sales-report', { params }),
  
  // **REMOVED**: These don't match actual backend routes
  // getSalesAnalytics: (params = {}) => api.get('/analytics/sales', { params }),
  // getRevenueAnalytics: (params = {}) => api.get('/analytics/revenue', { params }),
  // getProjectAnalytics: (params = {}) => api.get('/analytics/projects', { params }),
  // getLeadAnalytics: (params = {}) => api.get('/analytics/leads', { params }),
  // getUserPerformance: (params = {}) => api.get('/analytics/users', { params }),
};

// =============================================================================
// 14. **NEW**: BUDGET VS ACTUAL ANALYTICS SERVICES (/api/analytics)
// =============================================================================
export const budgetVsActualAPI = {
  // Budget vs Actual analytics (confirmed in backend)
  getBudgetVsActual: (params = {}) => api.get('/analytics/budget-vs-actual', { params }),
  getBudgetDashboard: (params = {}) => api.get('/analytics/budget-dashboard', { params }),
  getRevenueAnalysis: (params = {}) => api.get('/analytics/revenue-analysis', { params }),
  getLeadAnalysis: (params = {}) => api.get('/analytics/lead-analysis', { params }),
  getProjectComparison: (params = {}) => api.get('/analytics/project-comparison', { params }),
  getMarketingROI: (params = {}) => api.get('/analytics/marketing-roi', { params }),
  getSalesAnalysis: (params = {}) => api.get('/analytics/sales-analysis', { params }),
  
  // Quick KPI endpoints
  getRevenueKPIs: (params = {}) => api.get('/analytics/revenue-kpis', { params }),
  getSalesKPIs: (params = {}) => api.get('/analytics/sales-kpis', { params }),
  getLeadKPIs: (params = {}) => api.get('/analytics/lead-kpis', { params }),
};

// =============================================================================
// 15. PREDICTIVE ANALYTICS SERVICES (/api/analytics/predictions)
// =============================================================================
export const predictiveAPI = {
  // Sales forecasting (confirmed in backend)
  getSalesForecast: (params = {}) => api.get('/analytics/predictions/sales-forecast', { params }),
  
  // Revenue projections (confirmed in backend)
  getRevenueProjection: (params = {}) => api.get('/analytics/predictions/revenue-projection', { params }),
  
  // Lead conversion probability (confirmed in backend)
  getLeadConversionProbability: (params = {}) => api.get('/analytics/predictions/lead-conversion-probability', { params }),
  
  // Inventory turnover analysis (confirmed in backend)
  getInventoryTurnover: (params = {}) => api.get('/analytics/predictions/inventory-turnover', { params }),
  
  // **REMOVED**: These routes don't exist in backend currently
  // getPredictionsDashboard: (params = {}) => api.get('/analytics/predictions/dashboard-summary', { params }),
  // getPredictionsHealth: () => api.get('/analytics/predictions/health-check'),
};

// =============================================================================
// 16. PAYMENT SERVICES (/api/payments) - COMPLETELY REDESIGNED
// =============================================================================
export const paymentAPI = {
  // **REDESIGNED**: Based on actual backend payment system architecture
  
  // Payment Plans
  createPaymentPlan: (planData) => api.post('/payments/plans', planData),
  getPaymentPlanDetails: (saleId) => api.get(`/payments/plans/${saleId}`),
  updatePaymentPlan: (planId, planData) => api.put(`/payments/plans/${planId}`, planData),
  
  // Installments
  getInstallments: (planId) => api.get(`/payments/installments/${planId}`),
  updateInstallment: (installmentId, installmentData) => api.put(`/payments/installments/${installmentId}`, installmentData),
  waiveInstallment: (installmentId, waiveData) => api.post(`/payments/installments/${installmentId}/waive`, waiveData),
  
  // Payment Transactions
  recordPayment: (paymentData) => api.post('/payments/transactions', paymentData),
  updatePaymentTransaction: (transactionId, transactionData) => api.put(`/payments/transactions/${transactionId}`, transactionData),
  getPaymentTransactions: (planId) => api.get(`/payments/transactions/${planId}`),
  verifyPaymentTransaction: (transactionId, verificationData) => api.post(`/payments/transactions/${transactionId}/verify`, verificationData),
  
  // Payment Reports
  getOverduePayments: (params = {}) => api.get('/payments/reports/overdue', { params }),
  getPaymentsDueToday: (params = {}) => api.get('/payments/reports/due-today', { params }),
  getPaymentStatistics: (params = {}) => api.get('/payments/reports/statistics', { params }),
  
  // **REMOVED**: These don't match actual backend architecture
  // getPayments: (params = {}) => api.get('/payments', { params }),
  // getPayment: (id) => api.get(`/payments/${id}`),
  // createPayment: (paymentData) => api.post('/payments', paymentData),
  // updatePayment: (id, paymentData) => api.put(`/payments/${id}`, paymentData),
  // processPayment: (id, processData) => api.post(`/payments/${id}/process`, processData),
  // getPaymentSchedule: (saleId) => api.get(`/payments/schedule/${saleId}`),
  // generatePaymentReminder: (paymentId) => api.post(`/payments/${paymentId}/reminder`),
};

// =============================================================================
// 17. COMMISSION SERVICES (/api/commissions) - ENHANCED
// =============================================================================
// Updated commissionAPI with missing structure methods
// Add this to your services/api.js file

export const commissionAPI = {
  // Basic commission operations
  getCommissions: (params = {}) => api.get('/commissions', { params }),
  getCommission: (id) => api.get(`/commissions/${id}`),
  calculateCommission: (calculationData) => api.post('/commissions/calculate', calculationData),
  
  // Commission approval operations
  approveCommission: (id) => api.put(`/commissions/${id}/approve`),
  rejectCommission: (id, data) => api.put(`/commissions/${id}/reject`, data),
  putCommissionOnHold: (id) => api.put(`/commissions/${id}/hold`),
  releaseCommissionHold: (id) => api.put(`/commissions/${id}/release-hold`),
  recalculateCommission: (id) => api.post(`/commissions/${id}/recalculate`),
  
  // Commission payment operations
  recordCommissionPayment: (id, paymentData) => api.post(`/commissions/${id}/payment`, paymentData),
  processBulkCommissionPayments: (paymentData) => api.post('/commissions/bulk-payment', paymentData),
  
  // Commission structure management (MISSING METHODS ADDED)
  getCommissionStructures: (params = {}) => api.get('/commissions/structures', { params }),
  getCommissionStructure: (id) => api.get(`/commissions/structures/${id}`),
  createCommissionStructure: (structureData) => api.post('/commissions/structures', structureData),
  updateCommissionStructure: (id, structureData) => api.put(`/commissions/structures/${id}`, structureData),
  deleteCommissionStructure: (id) => api.delete(`/commissions/structures/${id}`),
  deactivateCommissionStructure: (id, data = {}) => api.delete(`/commissions/structures/${id}`, { data }),
  
  // Commission creation for sales
  createCommissionForSale: (saleData) => api.post('/commissions/create-for-sale', saleData),
  
  // Commission reports and analytics
  getCommissionReport: (params = {}) => api.get('/commissions/reports/detailed', { params }),
  getCommissionAnalytics: (params = {}) => api.get('/commissions/analytics', { params }),
  getOverdueCommissions: (params = {}) => api.get('/commissions/reports/overdue', { params }),
  getPartnerPerformance: (partnerId, params = {}) => api.get(`/commissions/partners/${partnerId}/performance`, { params }),
  
  // Bulk operations
  bulkApproveCommissions: (commissionIds) => api.post('/commissions/bulk-approve', { commissionIds }),
};

// =============================================================================
// 18. DOCUMENT SERVICES (/api/documents) - ENHANCED
// =============================================================================
export const documentAPI = {
  // Basic document operations (confirmed in backend)
  getDocuments: (params = {}) => api.get('/documents', { params }),
  getDocument: (id) => api.get(`/documents/${id}`),
  
  // Upload document (confirmed in backend)
  uploadDocument: (documentData) => {
    const formData = new FormData();
    Object.keys(documentData).forEach(key => {
      formData.append(key, documentData[key]);
    });
    return api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Update and delete documents (confirmed in backend)
  updateDocument: (id, documentData) => api.put(`/documents/${id}`, documentData),
  deleteDocument: (id) => api.delete(`/documents/${id}`),
  
  // **NEW**: Document categories (confirmed in backend)
  createDocumentCategory: (categoryData) => api.post('/documents/categories', categoryData),
  getDocumentCategories: () => api.get('/documents/categories'),
  getCategoryTree: () => api.get('/documents/categories/tree'),
  updateDocumentCategory: (id, categoryData) => api.put(`/documents/categories/${id}`, categoryData),
  deleteDocumentCategory: (id) => api.delete(`/documents/categories/${id}`),
  
  // **NEW**: Document approval workflows (confirmed in backend)
  getPendingApprovals: (params = {}) => api.get('/documents/approvals/pending', { params }),
  approveDocument: (id, approvalData) => api.post(`/documents/${id}/approve`, approvalData),
  rejectDocument: (id, rejectionData) => api.post(`/documents/${id}/reject`, rejectionData),
  
  // **NEW**: Document templates (confirmed in backend)
  getDocumentTemplates: () => api.get('/documents/templates'),
  generateFromTemplate: (templateId, templateData) => api.post(`/documents/templates/${templateId}/generate`, templateData),
  
  // **NEW**: Document versioning (confirmed in backend)
  getDocumentVersions: (id) => api.get(`/documents/${id}/versions`),
  createDocumentVersion: (id, versionData) => api.post(`/documents/${id}/versions`, versionData),
  restoreDocumentVersion: (id, versionId) => api.post(`/documents/${id}/versions/${versionId}/restore`),
  
  // **NEW**: Document sharing (confirmed in backend)
  shareDocument: (id, shareData) => api.post(`/documents/${id}/share`, shareData),
  getDocumentShares: (id) => api.get(`/documents/${id}/shares`),
  revokeDocumentShare: (id, shareId) => api.delete(`/documents/${id}/shares/${shareId}`),
};

// =============================================================================
// 19. CONSTRUCTION SERVICES (/api/construction) - ENHANCED
// =============================================================================
export const constructionAPI = {
  // Milestones (confirmed in backend)
  getMilestones: (params = {}) => api.get('/construction/milestones', { params }),
  getMilestone: (id) => api.get(`/construction/milestones/${id}`),
  createMilestone: (milestoneData) => api.post('/construction/milestones', milestoneData),
  updateMilestone: (id, milestoneData) => api.put(`/construction/milestones/${id}`, milestoneData),
  deleteMilestone: (id) => api.delete(`/construction/milestones/${id}`),
  getOverdueMilestones: (params = {}) => api.get('/construction/milestones/overdue', { params }),
  
  // Progress tracking (confirmed in backend)
  updateMilestoneProgress: (id, progressData) => api.put(`/construction/milestones/${id}/progress`, progressData),
  
  // **NEW**: Quality control (confirmed in backend)
  addQualityCheck: (milestoneId, qualityData) => api.post(`/construction/milestones/${milestoneId}/quality-checks`, qualityData),
  updateQualityCheck: (milestoneId, checkId, updateData) => api.put(`/construction/milestones/${milestoneId}/quality-checks/${checkId}`, updateData),
  
  // **NEW**: Issue management (confirmed in backend)
  addIssue: (milestoneId, issueData) => api.post(`/construction/milestones/${milestoneId}/issues`, issueData),
  
  // **NEW**: Progress documentation (confirmed in backend)
  uploadProgressPhotos: (milestoneId, photosData) => {
    const formData = new FormData();
    photosData.forEach((photo, index) => {
      formData.append('photos', photo);
    });
    return api.post(`/construction/milestones/${milestoneId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Project timeline (confirmed in backend)
  getProjectTimeline: (projectId) => api.get(`/construction/projects/${projectId}/timeline`),
  
  // **NEW**: Analytics (confirmed in backend)
  getConstructionAnalytics: (params = {}) => api.get('/construction/analytics', { params }),
};

// =============================================================================
// 20. CONTRACTOR SERVICES (/api/contractors) - ENHANCED
// =============================================================================
export const contractorAPI = {
  // Basic CRUD operations (confirmed in backend)
  getContractors: (params = {}) => api.get('/contractors', { params }),
  getContractor: (id) => api.get(`/contractors/${id}`),
  createContractor: (contractorData) => api.post('/contractors', contractorData),
  updateContractor: (id, contractorData) => api.put(`/contractors/${id}`, contractorData),
  deleteContractor: (id) => api.delete(`/contractors/${id}`),
  
  // **NEW**: Contractor analytics (confirmed in backend)
  getContractorAnalytics: (params = {}) => api.get('/contractors/analytics', { params }),
  getAvailableContractors: (params = {}) => api.get('/contractors/available', { params }),
  getContractorsBySpecialization: (specialization) => api.get(`/contractors/by-specialization/${specialization}`),
  
  // **NEW**: Contractor documents (confirmed in backend)
  uploadContractorDocument: (id, documentData) => {
    const formData = new FormData();
    formData.append('document', documentData);
    return api.post(`/contractors/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // **NEW**: Contractor reviews (confirmed in backend)
  addContractorReview: (id, reviewData) => api.post(`/contractors/${id}/reviews`, reviewData),
  
  // **NEW**: Contractor status management (confirmed in backend)
  updateContractorStatus: (id, statusData) => api.put(`/contractors/${id}/status`, statusData),
  togglePreferredStatus: (id) => api.put(`/contractors/${id}/preferred`),
  
  // **NEW**: Internal notes (confirmed in backend)
  addInternalNote: (id, noteData) => api.post(`/contractors/${id}/notes`, noteData),
};

// =============================================================================
// 21. SYSTEM SERVICES (Health, Performance, Docs) - SAME
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
  projectPayment: projectPaymentAPI, // **NEW**
  tower: towerAPI,
  unit: unitAPI,
  lead: leadAPI,
  sales: salesAPI,
  pricing: pricingAPI,
  ai: aiAPI,
  // aiConversation: aiConversationAPI, // **REMOVED** - Not implemented in backend
  file: fileAPI,
  analytics: analyticsAPI,
  budgetVsActual: budgetVsActualAPI, // **NEW**
  predictive: predictiveAPI,
  payment: paymentAPI,
  commission: commissionAPI,
  document: documentAPI,
  construction: constructionAPI,
  contractor: contractorAPI,
  system: systemAPI,
};
// File: src/services/api.js
// Description: Complete API service configuration for PropVantage AI - Enhanced for Phase 1 Analytics
// Version: 2.1 - ENHANCED for Phase 1 Analytics (ADDITIVE ONLY - No existing functionality removed)
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
// 1. AUTHENTICATION SERVICES (/api/auth) - UNCHANGED
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
// 2. USER MANAGEMENT SERVICES (/api/users) - UNCHANGED
// =============================================================================
export const userAPI = {
  // Get all users in organization
  getUsers: (params = {}) => api.get('/users', { params }),
  
  // Update user by ID
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  
  // Invite new user
  inviteUser: (inviteData) => api.post('/users/invite', inviteData),
};

// =============================================================================
// 3. PROJECT MANAGEMENT SERVICES (/api/projects) - UNCHANGED
// =============================================================================
export const projectAPI = {
  // Basic CRUD operations (confirmed in backend)
  getProjects: (params = {}) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post('/projects', projectData),
  updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
  deleteProject: (id) => api.delete(`/projects/${id}`),
};

// =============================================================================
// 4. PROJECT PAYMENT CONFIGURATION SERVICES (/api/projects) - UNCHANGED
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
// 5. TOWER MANAGEMENT SERVICES (/api/towers) - UNCHANGED
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
// 6. UNIT MANAGEMENT SERVICES (/api/units) - UNCHANGED
// =============================================================================
export const unitAPI = {
  // Get all units
  getUnits: (params = {}) => api.get('/units', { params }),
  
  // Get unit statistics (confirmed in backend)
  getUnitStatistics: (params = {}) => api.get('/units/statistics', { params }),
  
  // Get unit by ID
  getUnit: (id) => api.get(`/units/${id}`),
  
  // Create new unit
  createUnit: (unitData) => api.post('/units', unitData),
  
  // Update unit
  updateUnit: (id, unitData) => api.put(`/units/${id}`, unitData),
  
  // Delete unit
  deleteUnit: (id) => api.delete(`/units/${id}`),
};

// =============================================================================
// 7. LEAD MANAGEMENT SERVICES (/api/leads) - UNCHANGED
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
  
  // Lead scoring endpoints (confirmed in backend)
  getLeadScore: (id) => api.get(`/leads/${id}/score`),
  recalculateLeadScore: (id) => api.put(`/leads/${id}/recalculate-score`),
  getHighPriorityLeads: (params = {}) => api.get('/leads/high-priority', { params }),
  getLeadsNeedingAttention: (params = {}) => api.get('/leads/needs-attention', { params }),
  getScoreAnalytics: (params = {}) => api.get('/leads/score-analytics', { params }),
  bulkRecalculateScores: (leadIds) => api.post('/leads/bulk-recalculate-scores', { leadIds }),
  getLeadScoreHistory: (id) => api.get(`/leads/${id}/score-history`),
  
  // Scoring configuration (confirmed in backend)
  getScoringConfig: () => api.get('/leads/scoring-config'),
  updateScoringConfig: (configData) => api.put('/leads/scoring-config', configData),
};

// =============================================================================
// 8. SALES MANAGEMENT SERVICES (/api/sales) - UNCHANGED
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
};

// =============================================================================
// 9. PRICING SERVICES (/api/pricing) - UNCHANGED
// =============================================================================
export const pricingAPI = {
  // Generate cost sheet for unit (confirmed in backend)
  generateCostSheet: (unitId, costSheetData) => api.post(`/pricing/cost-sheet/${unitId}`, costSheetData),
  
  // Get dynamic pricing suggestions (confirmed in backend)
  getDynamicPricing: (projectId) => api.get(`/pricing/dynamic/${projectId}`),
};

// =============================================================================
// 10. AI INSIGHTS SERVICES (/api/ai) - UNCHANGED
// =============================================================================
export const aiAPI = {
  // Get AI insights for lead (confirmed in backend)
  getLeadInsights: (leadId) => api.get(`/ai/leads/${leadId}/insights`),
};

// =============================================================================
// 11. FILE MANAGEMENT SERVICES (/api/files) - UNCHANGED
// =============================================================================
export const fileAPI = {
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
};

// =============================================================================
// 12. ANALYTICS SERVICES - ENHANCED FOR PHASE 1 (EXISTING + NEW)
// =============================================================================
export const analyticsAPI = {
  // =============================================================================
  // EXISTING ANALYTICS ENDPOINTS (UNCHANGED)
  // =============================================================================
  
  // Basic analytics (confirmed in backend) - UNCHANGED
  getSalesSummary: (params = {}) => api.get('/analytics/sales-summary', { params }),
  getLeadFunnel: (params = {}) => api.get('/analytics/lead-funnel', { params }),
  getDashboard: (params = {}) => api.get('/analytics/dashboard', { params }),
  getSalesReport: (params = {}) => api.get('/analytics/sales-report', { params }),

  // =============================================================================
  // NEW ENHANCED ANALYTICS FOR PHASE 1 (ADDITIVE ONLY)
  // =============================================================================
  
  /**
   * NEW: Get real-time KPI metrics for dashboard widgets
   * Uses existing dashboard endpoint with format parameter
   */
  getRealtimeKPIs: (params = {}) => api.get('/analytics/dashboard', { 
    params: { ...params, format: 'kpi' } 
  }),
  
  /**
   * NEW: Get dashboard summary with key metrics
   * Uses existing dashboard endpoint with format parameter
   */
  getDashboardSummary: (params = {}) => api.get('/analytics/dashboard', { 
    params: { ...params, format: 'summary' } 
  }),
  
  /**
   * NEW: Get sales performance trends over time
   * Uses existing sales-report endpoint with include parameter
   */
  getSalesTrends: (params = {}) => api.get('/analytics/sales-report', { 
    params: { ...params, include: 'trends' } 
  }),
  
  /**
   * NEW: Get sales team performance analytics
   * Uses existing sales-report endpoint with groupBy parameter
   */
  getTeamPerformance: (params = {}) => api.get('/analytics/sales-report', { 
    params: { ...params, groupBy: 'user', include: 'performance' } 
  }),
  
  /**
   * NEW: Get lead conversion analytics
   * Uses existing lead-funnel endpoint with focus parameter
   */
  getLeadConversion: (params = {}) => api.get('/analytics/lead-funnel', { 
    params: { ...params, focus: 'conversion' } 
  }),
  
  /**
   * NEW: Get lead source performance analytics
   * Uses existing lead-funnel endpoint with groupBy parameter
   */
  getLeadSourcePerformance: (params = {}) => api.get('/analytics/lead-funnel', { 
    params: { ...params, groupBy: 'source', include: 'performance' } 
  }),
  
  /**
   * NEW: Get lead quality metrics and analytics
   * Uses existing lead-funnel endpoint with include parameter
   */
  getLeadQualityMetrics: (params = {}) => api.get('/analytics/lead-funnel', { 
    params: { ...params, include: 'quality' } 
  }),
  
  /**
   * NEW: Export analytics data to various formats
   * Generic export functionality for all report types
   */
  exportReport: (reportType, params = {}) => api.get(`/analytics/${reportType}/export`, { 
    params,
    responseType: 'blob' // For file downloads
  }),
  
  /**
   * NEW: Schedule recurring analytics reports
   * For future implementation of automated reporting
   */
  scheduleReport: (scheduleData) => api.post('/analytics/schedule-report', scheduleData),
};

// =============================================================================
// 13. BUDGET VS ACTUAL ANALYTICS - ENHANCED (EXISTING + NEW)
// =============================================================================
export const budgetVsActualAPI = {
  // =============================================================================
  // EXISTING BUDGET ANALYTICS (UNCHANGED)
  // =============================================================================
  
  // Budget vs Actual analytics (confirmed in backend) - UNCHANGED
  getBudgetVsActual: (params = {}) => api.get('/analytics/budget-vs-actual', { params }),
  getBudgetDashboard: (params = {}) => api.get('/analytics/budget-dashboard', { params }),
  getRevenueAnalysis: (params = {}) => api.get('/analytics/revenue-analysis', { params }),
  getLeadAnalysis: (params = {}) => api.get('/analytics/lead-analysis', { params }),
  getProjectComparison: (params = {}) => api.get('/analytics/project-comparison', { params }),
  getMarketingROI: (params = {}) => api.get('/analytics/marketing-roi', { params }),
  getSalesAnalysis: (params = {}) => api.get('/analytics/sales-analysis', { params }),
  
  // Quick KPI endpoints - UNCHANGED
  getRevenueKPIs: (params = {}) => api.get('/analytics/revenue-kpis', { params }),
  getSalesKPIs: (params = {}) => api.get('/analytics/sales-kpis', { params }),
  getLeadKPIs: (params = {}) => api.get('/analytics/lead-kpis', { params }),

  // =============================================================================
  // NEW ENHANCED BUDGET ANALYTICS FOR PHASE 1 (ADDITIVE ONLY)
  // =============================================================================
  
  /**
   * NEW: Get real-time budget alerts and notifications
   * Uses existing budget-dashboard endpoint with focus parameter
   */
  getBudgetAlerts: (params = {}) => api.get('/analytics/budget-dashboard', { 
    params: { ...params, focus: 'alerts' } 
  }),
  
  /**
   * NEW: Get revenue trends and projections
   * Uses existing revenue-analysis endpoint with include parameter
   */
  getRevenueTrends: (params = {}) => api.get('/analytics/revenue-analysis', { 
    params: { ...params, include: 'trends,projections' } 
  }),
};

// =============================================================================
// 14. PREDICTIVE ANALYTICS SERVICES - UNCHANGED
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
};

// =============================================================================
// 15. PAYMENT SERVICES - UNCHANGED
// =============================================================================
export const paymentAPI = {
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
};

// =============================================================================
// 16. COMMISSION SERVICES - UNCHANGED
// =============================================================================
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
  
  // Commission structure management
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
// 17-21. ALL OTHER SERVICES REMAIN UNCHANGED
// =============================================================================

// Document services - UNCHANGED
export const documentAPI = {
  getDocuments: (params = {}) => api.get('/documents', { params }),
  getDocument: (id) => api.get(`/documents/${id}`),
  uploadDocument: (documentData) => {
    const formData = new FormData();
    Object.keys(documentData).forEach(key => {
      formData.append(key, documentData[key]);
    });
    return api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateDocument: (id, documentData) => api.put(`/documents/${id}`, documentData),
  deleteDocument: (id) => api.delete(`/documents/${id}`),
  createDocumentCategory: (categoryData) => api.post('/documents/categories', categoryData),
  getDocumentCategories: () => api.get('/documents/categories'),
  getCategoryTree: () => api.get('/documents/categories/tree'),
  updateDocumentCategory: (id, categoryData) => api.put(`/documents/categories/${id}`, categoryData),
  deleteDocumentCategory: (id) => api.delete(`/documents/categories/${id}`),
  getPendingApprovals: (params = {}) => api.get('/documents/approvals/pending', { params }),
  approveDocument: (id, approvalData) => api.post(`/documents/${id}/approve`, approvalData),
  rejectDocument: (id, rejectionData) => api.post(`/documents/${id}/reject`, rejectionData),
  getDocumentTemplates: () => api.get('/documents/templates'),
  generateFromTemplate: (templateId, templateData) => api.post(`/documents/templates/${templateId}/generate`, templateData),
  getDocumentVersions: (id) => api.get(`/documents/${id}/versions`),
  createDocumentVersion: (id, versionData) => api.post(`/documents/${id}/versions`, versionData),
  restoreDocumentVersion: (id, versionId) => api.post(`/documents/${id}/versions/${versionId}/restore`),
  shareDocument: (id, shareData) => api.post(`/documents/${id}/share`, shareData),
  getDocumentShares: (id) => api.get(`/documents/${id}/shares`),
  revokeDocumentShare: (id, shareId) => api.delete(`/documents/${id}/shares/${shareId}`),
};

// Construction services - UNCHANGED
export const constructionAPI = {
  getMilestones: (params = {}) => api.get('/construction/milestones', { params }),
  getMilestone: (id) => api.get(`/construction/milestones/${id}`),
  createMilestone: (milestoneData) => api.post('/construction/milestones', milestoneData),
  updateMilestone: (id, milestoneData) => api.put(`/construction/milestones/${id}`, milestoneData),
  deleteMilestone: (id) => api.delete(`/construction/milestones/${id}`),
  getOverdueMilestones: (params = {}) => api.get('/construction/milestones/overdue', { params }),
  updateMilestoneProgress: (id, progressData) => api.put(`/construction/milestones/${id}/progress`, progressData),
  addQualityCheck: (milestoneId, qualityData) => api.post(`/construction/milestones/${milestoneId}/quality-checks`, qualityData),
  updateQualityCheck: (milestoneId, checkId, updateData) => api.put(`/construction/milestones/${milestoneId}/quality-checks/${checkId}`, updateData),
  addIssue: (milestoneId, issueData) => api.post(`/construction/milestones/${milestoneId}/issues`, issueData),
  uploadProgressPhotos: (milestoneId, photosData) => {
    const formData = new FormData();
    photosData.forEach((photo, index) => {
      formData.append('photos', photo);
    });
    return api.post(`/construction/milestones/${milestoneId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getProjectTimeline: (projectId) => api.get(`/construction/projects/${projectId}/timeline`),
  getConstructionAnalytics: (params = {}) => api.get('/construction/analytics', { params }),
};

// Contractor services - UNCHANGED
export const contractorAPI = {
  getContractors: (params = {}) => api.get('/contractors', { params }),
  getContractor: (id) => api.get(`/contractors/${id}`),
  createContractor: (contractorData) => api.post('/contractors', contractorData),
  updateContractor: (id, contractorData) => api.put(`/contractors/${id}`, contractorData),
  deleteContractor: (id) => api.delete(`/contractors/${id}`),
  getContractorAnalytics: (params = {}) => api.get('/contractors/analytics', { params }),
  getAvailableContractors: (params = {}) => api.get('/contractors/available', { params }),
  getContractorsBySpecialization: (specialization) => api.get(`/contractors/by-specialization/${specialization}`),
  uploadContractorDocument: (id, documentData) => {
    const formData = new FormData();
    formData.append('document', documentData);
    return api.post(`/contractors/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  addContractorReview: (id, reviewData) => api.post(`/contractors/${id}/reviews`, reviewData),
  updateContractorStatus: (id, statusData) => api.put(`/contractors/${id}/status`, statusData),
  togglePreferredStatus: (id) => api.put(`/contractors/${id}/preferred`),
  addInternalNote: (id, noteData) => api.post(`/contractors/${id}/notes`, noteData),
};

// System services - UNCHANGED
export const systemAPI = {
  healthCheck: () => api.get('/health'),
  getApiDocs: () => api.get('/docs'),
  getPerformanceMetrics: () => api.get('/performance'),
  getAIFeatures: () => api.get('/ai-features'),
};

// Invoice services - UNCHANGED
export const invoiceAPI = {
  createInvoiceFromSale: (saleId, invoiceData) => api.post(`/invoices/from-sale/${saleId}`, invoiceData),
  getInvoices: (params = {}) => api.get('/invoices', { params }),
  getInvoice: (id) => api.get(`/invoices/${id}`),
  updateInvoice: (id, invoiceData) => api.put(`/invoices/${id}`, invoiceData),
  recordPayment: (id, paymentData) => api.post(`/invoices/${id}/payment`, paymentData),
  cancelInvoice: (id, cancellationData) => api.put(`/invoices/${id}/cancel`, cancellationData),
  getStatistics: (params = {}) => api.get('/invoices/statistics', { params }),
  getOverdueInvoices: (params = {}) => api.get('/invoices/overdue', { params }),
  exportInvoices: (params = {}) => api.get('/invoices/export', { params }),
};

// =============================================================================
// NEW UTILITY FUNCTIONS FOR ANALYTICS - PHASE 1 ENHANCEMENT
// =============================================================================

/**
 * Analytics utility functions for data processing and formatting
 * NEW: Added comprehensive utility functions for Phase 1 analytics
 */
export const analyticsUtils = {
  /**
   * Format currency values for display
   * @param {number} value - Numeric value to format
   * @param {string} currency - Currency code (default: INR)
   * @returns {string} Formatted currency string
   */
  formatCurrency: (value, currency = 'INR') => {
    if (typeof value !== 'number' || isNaN(value)) return '₹0';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  },
  
  /**
   * Format percentage values for display
   * @param {number} value - Percentage value (0-100)
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted percentage string
   */
  formatPercentage: (value, decimals = 1) => {
    if (typeof value !== 'number' || isNaN(value)) return '0%';
    return `${value.toFixed(decimals)}%`;
  },
  
  /**
   * Calculate percentage change between two values
   * @param {number} current - Current value
   * @param {number} previous - Previous value
   * @returns {number} Percentage change
   */
  calculatePercentageChange: (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  },
  
  /**
   * Get appropriate color for metric based on performance
   * @param {number} value - Metric value
   * @param {number} target - Target value
   * @param {boolean} higherIsBetter - Whether higher values are better
   * @returns {string} Color code for the metric
   */
  getMetricColor: (value, target, higherIsBetter = true) => {
    if (!target) return 'info';
    
    const ratio = value / target;
    if (higherIsBetter) {
      if (ratio >= 1.1) return 'success';
      if (ratio >= 0.9) return 'warning';
      return 'error';
    } else {
      if (ratio <= 0.9) return 'success';
      if (ratio <= 1.1) return 'warning';
      return 'error';
    }
  },

  /**
   * Format large numbers with appropriate suffixes (K, M, Cr)
   * @param {number} value - Numeric value to format
   * @returns {string} Formatted number string
   */
  formatLargeNumber: (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '0';
    
    const abs = Math.abs(value);
    if (abs >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`; // Crores
    if (abs >= 100000) return `${(value / 100000).toFixed(1)}L`; // Lakhs
    if (abs >= 1000) return `${(value / 1000).toFixed(1)}K`; // Thousands
    return value.toString();
  },

  /**
   * Calculate trend direction based on historical data
   * @param {Array} data - Array of numeric values (oldest to newest)
   * @returns {string} Trend direction: 'up', 'down', or 'stable'
   */
  calculateTrend: (data) => {
    if (!Array.isArray(data) || data.length < 2) return 'stable';
    
    const recent = data.slice(-3); // Last 3 data points
    if (recent.length < 2) return 'stable';
    
    const change = recent[recent.length - 1] - recent[0];
    const threshold = Math.abs(recent[0]) * 0.05; // 5% threshold
    
    if (change > threshold) return 'up';
    if (change < -threshold) return 'down';
    return 'stable';
  },
};

// =============================================================================
// NEW REAL-TIME DATA SERVICE - PHASE 1 ENHANCEMENT
// =============================================================================

/**
 * Real-time Data API Service
 * NEW: Added for Phase 1 real-time dashboard capabilities
 */
export const realTimeAPI = {
  /**
   * Subscribe to real-time analytics updates
   * @param {string} channel - Analytics channel to subscribe to
   * @param {Function} callback - Callback function for updates
   * @returns {Function} Unsubscribe function
   */
  subscribeToAnalytics: (channel, callback) => {
    // Placeholder for WebSocket integration
    console.log(`Subscribing to real-time analytics channel: ${channel}`);
    
    // Simulate real-time updates with polling for now
    const interval = setInterval(() => {
      // This would be replaced with actual WebSocket data
      callback({ channel, timestamp: new Date(), data: {} });
    }, 30000); // 30 seconds
    
    return () => {
      clearInterval(interval);
      console.log(`Unsubscribed from ${channel}`);
    };
  },
  
  /**
   * Get current system status for real-time monitoring
   * @returns {Promise} System status data
   */
  getSystemStatus: () => api.get('/analytics/system-status'),
};

// =============================================================================
// EXISTING UTILITY FUNCTIONS - UNCHANGED
// =============================================================================

// Helper function to handle API errors - UNCHANGED
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

// Helper function to check if user is authenticated - UNCHANGED
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Helper function to get current user - UNCHANGED
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Helper function to logout user - UNCHANGED
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// =============================================================================
// DEFAULT EXPORT - ENHANCED FOR PHASE 1 (EXISTING + NEW)
// =============================================================================

// Default export with all APIs - ENHANCED
export default {
  // Existing APIs (UNCHANGED)
  auth: authAPI,
  user: userAPI,
  project: projectAPI,
  projectPayment: projectPaymentAPI,
  tower: towerAPI,
  unit: unitAPI,
  lead: leadAPI,
  sales: salesAPI,
  pricing: pricingAPI,
  ai: aiAPI,
  file: fileAPI,
  analytics: analyticsAPI, // ENHANCED
  budgetVsActual: budgetVsActualAPI, // ENHANCED
  predictive: predictiveAPI,
  payment: paymentAPI,
  commission: commissionAPI,
  document: documentAPI,
  construction: constructionAPI,
  contractor: contractorAPI,
  system: systemAPI,
  invoice: invoiceAPI,
  
  // NEW for Phase 1
  realTime: realTimeAPI,
  
  // Utilities (ENHANCED)
  utils: {
    analytics: analyticsUtils, // NEW
    error: handleAPIError, // EXISTING
  },
};
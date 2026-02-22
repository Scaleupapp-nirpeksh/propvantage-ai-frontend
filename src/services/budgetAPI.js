// File: src/services/budgetAPI.js
// Description: Enhanced API service for budget variance tracking
// Uses shared axios instance from api.js (withCredentials, auto-refresh, etc.)

import { api } from './api';

/**
 * Budget Variance API Service
 * Handles all budget variance tracking API calls
 */
export const budgetVarianceAPI = {
  /**
   * Get real-time budget variance analysis for a specific project
   * @param {string} projectId - The project ID
   * @returns {Promise} API response with budget variance data
   */
  getProjectBudgetVariance: async (projectId) => {
    try {
      console.log(`🔄 Fetching budget variance for project: ${projectId}`);
      const response = await api.get(`/projects/${projectId}/budget-variance`);
      console.log(`✅ Budget variance data received:`, response.data);
      return response;
    } catch (error) {
      console.error(`❌ Failed to fetch budget variance for project ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Get budget variance summary for all projects
   * @param {object} params - Query parameters (limit, etc.)
   * @returns {Promise} API response with multi-project summary
   */
  getMultiProjectBudgetSummary: async (params = {}) => {
    try {
      console.log(`🔄 Fetching budget variance summary:`, params);
      const response = await api.get('/projects/budget-variance-summary', { params });
      console.log(`✅ Budget variance summary received:`, response.data);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch budget variance summary:', error);
      throw error;
    }
  },

  /**
   * Update project budget target
   * @param {string} projectId - The project ID
   * @param {object} budgetData - Budget target data
   * @param {number} budgetData.budgetTarget - Total budget target
   * @param {number} budgetData.targetPricePerUnit - Target price per unit
   * @returns {Promise} API response
   */
  updateProjectBudgetTarget: async (projectId, budgetData) => {
    try {
      console.log(`🔄 Updating budget target for project ${projectId}:`, budgetData);
      const response = await api.put(`/projects/${projectId}/budget-target`, budgetData);
      console.log(`✅ Budget target updated:`, response.data);
      return response;
    } catch (error) {
      console.error(`❌ Failed to update budget target for project ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Get budget tracking configuration for a project
   * @param {string} projectId - The project ID
   * @returns {Promise} API response with budget tracking config
   */
  getBudgetTrackingConfig: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      return {
        ...response,
        data: {
          budgetTracking: response.data.data.budgetTracking,
          targetRevenue: response.data.data.targetRevenue,
          totalUnits: response.data.data.totalUnits,
          targetPricePerUnit: response.data.data.targetPricePerUnit
        }
      };
    } catch (error) {
      console.error(`❌ Failed to fetch budget config for project ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Enable/disable budget tracking for a project
   * @param {string} projectId - The project ID
   * @param {boolean} enabled - Enable/disable budget tracking
   * @returns {Promise} API response
   */
  toggleBudgetTracking: async (projectId, enabled) => {
    try {
      const response = await api.patch(`/projects/${projectId}`, {
        'budgetTracking.enabled': enabled
      });
      console.log(`✅ Budget tracking ${enabled ? 'enabled' : 'disabled'} for project ${projectId}`);
      return response;
    } catch (error) {
      console.error(`❌ Failed to toggle budget tracking for project ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Get recent budget alerts for a project
   * @param {string} projectId - The project ID
   * @param {number} limit - Number of alerts to fetch (default: 10)
   * @returns {Promise} API response with recent alerts
   */
  getRecentBudgetAlerts: async (projectId, limit = 10) => {
    try {
      const response = await api.get(`/projects/${projectId}/budget-alerts?limit=${limit}`);
      return response;
    } catch (error) {
      console.error(`❌ Failed to fetch budget alerts for project ${projectId}:`, error);
      throw error;
    }
  },

  /**
   * Test budget variance system connectivity
   * @returns {Promise} API response
   */
  testBudgetVarianceSystem: async () => {
    try {
      const response = await api.get('/test-budget-variance');
      console.log('✅ Budget variance system test passed:', response.data);
      return response;
    } catch (error) {
      console.error('❌ Budget variance system test failed:', error);
      throw error;
    }
  }
};

/**
 * Helper functions for budget calculations and UI formatting
 */
export const budgetHelpers = {
  /**
   * Calculate variance percentage
   * @param {number} actual - Actual value
   * @param {number} expected - Expected value
   * @returns {number} Variance percentage
   */
  calculateVariancePercentage: (actual, expected) => {
    if (expected === 0) return 0;
    return ((actual - expected) / expected) * 100;
  },

  /**
   * Get variance status based on percentage
   * @param {number} variancePercentage - Variance percentage
   * @returns {object} Status object with color and severity
   */
  getVarianceStatus: (variancePercentage) => {
    const absVariance = Math.abs(variancePercentage);
    
    if (absVariance >= 20) {
      return {
        status: 'Critical',
        severity: 'critical',
        color: '#dc2626',
        bgColor: '#fef2f2',
        textColor: '#991b1b',
        icon: '🚨',
        actionRequired: true
      };
    } else if (absVariance >= 10) {
      return {
        status: 'Warning',
        severity: 'warning', 
        color: '#d97706',
        bgColor: '#fffbeb',
        textColor: '#92400e',
        icon: '⚠️',
        actionRequired: variancePercentage < 0 // Only if behind target
      };
    } else {
      return {
        status: 'On Track',
        severity: 'normal',
        color: '#059669',
        bgColor: '#ecfdf5',
        textColor: '#065f46',
        icon: '✅',
        actionRequired: false
      };
    }
  },

  /**
   * Format currency for display
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default: INR)
   * @returns {string} Formatted currency string
   */
  formatCurrency: (amount, currency = 'INR') => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  },

  /**
   * Format large numbers with K/L/Cr suffixes (Indian format)
   * @param {number} amount - Amount to format
   * @returns {string} Formatted amount with suffix
   */
  formatAmountWithSuffix: (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
    
    if (amount >= 10000000) { // 1 Crore
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) { // 1 Lakh
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) { // 1 Thousand
      return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
      return `₹${Math.round(amount)}`;
    }
  },

  /**
   * Calculate budget progress percentage
   * @param {number} current - Current amount
   * @param {number} target - Target amount
   * @returns {number} Progress percentage (0-100)
   */
  calculateProgress: (current, target) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  },

  /**
   * Generate variance trend indicator
   * @param {number} currentVariance - Current variance percentage
   * @param {number} previousVariance - Previous variance percentage
   * @returns {object} Trend object
   */
  getVarianceTrend: (currentVariance, previousVariance) => {
    const difference = currentVariance - previousVariance;
    
    if (Math.abs(difference) < 1) {
      return { trend: 'stable', icon: '→', color: '#6b7280' };
    } else if (difference > 0) {
      return { trend: 'improving', icon: '↗️', color: '#059669' };
    } else {
      return { trend: 'declining', icon: '↘️', color: '#dc2626' };
    }
  },

  /**
   * Calculate required price adjustment for remaining units
   * @param {object} budgetData - Budget variance data from API
   * @returns {object} Price adjustment recommendations
   */
  calculatePriceAdjustment: (budgetData) => {
    const { calculations } = budgetData;
    
    if (!calculations || calculations.remainingUnits <= 0) {
      return {
        adjustmentNeeded: false,
        message: 'No units remaining'
      };
    }

    const adjustmentPercentage = calculations.priceAdjustmentNeeded || 0;
    
    return {
      adjustmentNeeded: Math.abs(adjustmentPercentage) > 5,
      adjustmentPercentage,
      requiredPrice: calculations.requiredAveragePricePerRemainingUnit,
      message: adjustmentPercentage > 0 
        ? `Increase prices by ${adjustmentPercentage.toFixed(1)}%`
        : adjustmentPercentage < -5
        ? `Can reduce prices by ${Math.abs(adjustmentPercentage).toFixed(1)}%`
        : 'Current pricing is optimal'
    };
  },

  /**
   * Validate budget data before API calls
   * @param {object} budgetData - Budget data to validate
   * @returns {object} Validation result
   */
  validateBudgetData: (budgetData) => {
    const errors = [];
    
    if (!budgetData.budgetTarget || budgetData.budgetTarget <= 0) {
      errors.push('Budget target must be greater than 0');
    }
    
    if (!budgetData.targetPricePerUnit || budgetData.targetPricePerUnit <= 0) {
      errors.push('Target price per unit must be greater than 0');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Generate alert severity levels for UI components
   * @param {array} alerts - Array of budget alerts
   * @returns {object} Alert summary
   */
  getAlertSummary: (alerts) => {
    const summary = {
      total: alerts.length,
      critical: 0,
      warning: 0,
      info: 0,
      unacknowledged: 0
    };
    
    alerts.forEach(alert => {
      summary[alert.severity] = (summary[alert.severity] || 0) + 1;
      if (!alert.acknowledged) {
        summary.unacknowledged++;
      }
    });
    
    return summary;
  }
};

/**
 * Budget data transformation utilities for UI components
 */
export const budgetTransformers = {
  /**
   * Transform API response for dashboard cards
   * @param {object} budgetData - Raw budget data from API
   * @returns {array} Array of card data objects
   */
  transformForDashboardCards: (budgetData) => {
    const { project, sales, calculations, performance } = budgetData;
    
    return [
      {
        title: 'Budget Target',
        value: budgetHelpers.formatAmountWithSuffix(project.budgetTarget),
        subtitle: `${project.totalUnits} units`,
        status: 'neutral'
      },
      {
        title: 'Revenue Generated',
        value: budgetHelpers.formatAmountWithSuffix(sales.totalRevenue),
        subtitle: `${sales.unitsSold} units sold`,
        status: performance.budgetProgress >= 80 ? 'positive' : 'neutral'
      },
      {
        title: 'Variance',
        value: `${calculations.variancePercentage.toFixed(1)}%`,
        subtitle: calculations.variancePercentage >= 0 ? 'Above target' : 'Behind target',
        status: budgetHelpers.getVarianceStatus(calculations.variancePercentage).severity
      },
      {
        title: 'Remaining Revenue',
        value: budgetHelpers.formatAmountWithSuffix(calculations.requiredRevenueFromRemainingUnits),
        subtitle: `${calculations.remainingUnits} units left`,
        status: calculations.remainingUnits > 0 ? 'neutral' : 'positive'
      }
    ];
  },

  /**
   * Transform pricing suggestions for table display
   * @param {array} pricingSuggestions - Raw pricing suggestions from API
   * @returns {array} Formatted table data
   */
  transformPricingSuggestions: (pricingSuggestions) => {
    return pricingSuggestions.map(suggestion => ({
      ...suggestion,
      currentPriceFormatted: budgetHelpers.formatAmountWithSuffix(suggestion.currentPrice),
      suggestedPriceFormatted: budgetHelpers.formatAmountWithSuffix(suggestion.suggestedPrice),
      priceIncreaseFormatted: `${suggestion.priceIncrease > 0 ? '+' : ''}${suggestion.priceIncrease}%`,
      priceIncreaseStatus: suggestion.priceIncrease > 10 ? 'high' : 
                          suggestion.priceIncrease > 0 ? 'medium' : 'low'
    }));
  }
};

export default budgetVarianceAPI;
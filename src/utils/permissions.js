// File: src/utils/permissions.js
// Pure utility functions for the dynamic module:action permission system.
// No React dependency — takes auth state as input.

/**
 * Check if user has a specific module:action permission.
 * Owner role bypasses all checks.
 */
export const checkPermission = (authState, permission) => {
  if (!authState) return false;
  if (authState.isOwner) return true;
  return (authState.permissions || []).includes(permission);
};

/**
 * Check if user has ALL specified permissions (AND logic).
 */
export const checkAllPermissions = (authState, ...perms) => {
  if (!authState) return false;
  if (authState.isOwner) return true;
  return perms.every(p => (authState.permissions || []).includes(p));
};

/**
 * Check if user has at least ONE of the specified permissions (OR logic).
 */
export const checkAnyPermission = (authState, ...perms) => {
  if (!authState) return false;
  if (authState.isOwner) return true;
  return perms.some(p => (authState.permissions || []).includes(p));
};

/**
 * Check if user can manage a target based on role level hierarchy.
 * Lower level number = higher authority.
 */
export const canManageLevel = (authState, targetLevel) => {
  if (!authState) return false;
  if (authState.isOwner) return true;
  return (authState.roleLevel ?? 100) < targetLevel;
};

/**
 * Maps legacy canAccess method names → new module:action permissions.
 * Each method resolves to true if user has ANY of the mapped permissions.
 */
export const LEGACY_PERMISSION_MAP = {
  userManagement:         ['users:view', 'users:update'],
  systemSettings:         ['roles:view'],
  organizationSettings:   ['roles:view'],
  projectManagement:      ['projects:create', 'projects:update'],
  financialReports:       ['payments:view', 'payments:reports'],
  salesReports:           ['sales:analytics', 'analytics:basic'],
  constructionManagement: ['construction:view', 'construction:update'],
  leadManagement:         ['leads:view'],
  salesPipeline:          ['sales:view'],
  customerInteractions:   ['leads:view', 'leads:update'],
  approveDocuments:       ['documents:approve'],
  viewFinancials:         ['payments:view', 'invoices:view'],
  manageContractors:      ['contractors:manage'],
  viewAllProjects:        ['projects:view'],
  viewOwnLeads:           ['leads:view'],
  editPricing:            ['pricing:dynamic_pricing'],
};

/**
 * Build a canAccess-compatible object from new permissions.
 */
export const buildCanAccess = (authState) => {
  const result = {};
  for (const [key, perms] of Object.entries(LEGACY_PERMISSION_MAP)) {
    result[key] = () => checkAnyPermission(authState, ...perms);
  }
  return result;
};

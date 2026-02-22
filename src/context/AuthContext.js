// File: src/context/AuthContext.js
// Description: Fixed Authentication Context with proper login redirect and state management
// Version: 2.0 - Enhanced with proper login flow and role-based routing
// Location: src/context/AuthContext.js

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

// Initial authentication state
const initialState = {
  // Authentication status
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  
  // User data
  user: null,
  organization: null,
  
  // Tokens
  token: null,
  refreshToken: null,
  
  // Error handling
  error: null,

  // Login attempt tracking
  loginAttempts: 0,
  lastLoginAttempt: null,

  // Dynamic permission system (from roleRef)
  roleRef: null,
  permissions: [],
  isOwner: false,
  roleLevel: 100,
};

// Action types for authentication reducer
const AuthActionTypes = {
  INITIALIZE_START: 'INITIALIZE_START',
  INITIALIZE_SUCCESS: 'INITIALIZE_SUCCESS',
  INITIALIZE_FAILURE: 'INITIALIZE_FAILURE',
  
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  
  LOGOUT: 'LOGOUT',
  
  UPDATE_USER: 'UPDATE_USER',
  UPDATE_ORGANIZATION: 'UPDATE_ORGANIZATION',
  
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_ERROR: 'SET_ERROR',
  
  REFRESH_TOKEN_SUCCESS: 'REFRESH_TOKEN_SUCCESS',
  REFRESH_TOKEN_FAILURE: 'REFRESH_TOKEN_FAILURE',
};

// Authentication reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AuthActionTypes.INITIALIZE_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AuthActionTypes.INITIALIZE_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        isAuthenticated: true,
        user: action.payload.user,
        organization: action.payload.organization,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        roleRef: action.payload.roleRef || null,
        permissions: action.payload.roleRef?.permissions || [],
        isOwner: action.payload.roleRef?.isOwnerRole || false,
        roleLevel: action.payload.roleRef?.level ?? 100,
        error: null,
      };

    case AuthActionTypes.INITIALIZE_FAILURE:
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        isAuthenticated: false,
        user: null,
        organization: null,
        token: null,
        refreshToken: null,
        error: action.payload,
      };

    case AuthActionTypes.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
        loginAttempts: state.loginAttempts + 1,
        lastLoginAttempt: new Date().toISOString(),
      };

    case AuthActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        organization: action.payload.organization,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        roleRef: action.payload.roleRef || null,
        permissions: action.payload.roleRef?.permissions || [],
        isOwner: action.payload.roleRef?.isOwnerRole || false,
        roleLevel: action.payload.roleRef?.level ?? 100,
        error: null,
        loginAttempts: 0,
      };

    case AuthActionTypes.LOGIN_FAILURE:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        organization: null,
        token: null,
        refreshToken: null,
        error: action.payload,
      };

    case AuthActionTypes.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AuthActionTypes.REGISTER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        organization: action.payload.organization,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        roleRef: action.payload.roleRef || null,
        permissions: action.payload.roleRef?.permissions || [],
        isOwner: action.payload.roleRef?.isOwnerRole || false,
        roleLevel: action.payload.roleRef?.level ?? 100,
        error: null,
      };

    case AuthActionTypes.REGISTER_FAILURE:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        organization: null,
        token: null,
        refreshToken: null,
        error: action.payload,
      };

    case AuthActionTypes.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
        isInitialized: true,
      };

    case AuthActionTypes.UPDATE_USER: {
      const updatedState = {
        ...state,
        user: { ...state.user, ...action.payload },
      };
      if (action.payload.roleRef) {
        updatedState.roleRef = action.payload.roleRef;
        updatedState.permissions = action.payload.roleRef.permissions || [];
        updatedState.isOwner = action.payload.roleRef.isOwnerRole || false;
        updatedState.roleLevel = action.payload.roleRef.level ?? 100;
      }
      return updatedState;
    }

    case AuthActionTypes.UPDATE_ORGANIZATION:
      return {
        ...state,
        organization: { ...state.organization, ...action.payload },
      };

    case AuthActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AuthActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
      };

    case AuthActionTypes.REFRESH_TOKEN_SUCCESS:
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        error: null,
      };

    case AuthActionTypes.REFRESH_TOKEN_FAILURE:
      return {
        ...initialState,
        isLoading: false,
        isInitialized: true,
        error: action.payload,
      };

    default:
      return state;
  }
};

// Create authentication context
const AuthContext = createContext({});

// Role hierarchy for access control
const ROLE_HIERARCHY = {
  'Business Head': 100,
  'Project Director': 90,
  'Sales Head': 80,
  'Finance Head': 80,
  'Marketing Head': 80,
  'Sales Manager': 70,
  'Finance Manager': 70,
  'Channel Partner Manager': 60,
  'Sales Executive': 50,
  'Channel Partner Admin': 40,
  'Channel Partner Agent': 30,
};

// Permission groups
const PERMISSION_GROUPS = {
  // Full system access
  ADMIN: ['Business Head', 'Project Director'],
  
  // Management level access
  MANAGEMENT: [
    'Business Head', 'Project Director', 'Sales Head', 'Finance Head', 
    'Marketing Head', 'Sales Manager', 'Finance Manager', 'Channel Partner Manager'
  ],
  
  // Sales team access
  SALES: [
    'Business Head', 'Project Director', 'Sales Head', 'Marketing Head',
    'Sales Manager', 'Sales Executive', 'Channel Partner Manager', 
    'Channel Partner Admin', 'Channel Partner Agent'
  ],
  
  // Finance team access
  FINANCE: [
    'Business Head', 'Project Director', 'Finance Head', 'Finance Manager'
  ],
  
  // Construction team access
  CONSTRUCTION: [
    'Business Head', 'Project Director', 'Sales Manager', 'Finance Manager'
  ],
  
  // View-only access
  VIEW_ONLY: [
    'Business Head', 'Project Director', 'Sales Head', 'Finance Head',
    'Marketing Head', 'Sales Manager', 'Finance Manager', 'Channel Partner Manager',
    'Sales Executive', 'Channel Partner Admin', 'Channel Partner Agent'
  ],
};

// Authentication Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication on app start
  useEffect(() => {
    initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh token before expiry (12 min = 3 min before 15-min token expires)
  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      const tokenRefreshInterval = setInterval(() => {
        refreshTokenIfNeeded();
      }, 12 * 60 * 1000);

      return () => clearInterval(tokenRefreshInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated, state.token]);

  // Sync auth state with interceptor token refresh / session-expired events
  useEffect(() => {
    const handleTokenRefreshed = (event) => {
      const { token } = event.detail;
      dispatch({
        type: AuthActionTypes.REFRESH_TOKEN_SUCCESS,
        payload: { token, refreshToken: null },
      });
    };

    const handleSessionExpired = () => {
      clearStoredAuth();
      dispatch({ type: AuthActionTypes.LOGOUT });
    };

    window.addEventListener('auth:token-refreshed', handleTokenRefreshed);
    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('auth:token-refreshed', handleTokenRefreshed);
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, []); // dispatch is stable from useReducer

  // Initialize authentication from stored tokens
  const initializeAuth = async () => {
    dispatch({ type: AuthActionTypes.INITIALIZE_START });

    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedOrganization = localStorage.getItem('organization');
      const storedRoleRef = localStorage.getItem('roleRef');

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        const organization = storedOrganization ? JSON.parse(storedOrganization) : null;
        const roleRef = storedRoleRef ? JSON.parse(storedRoleRef) : (user.roleRef || null);

        // Ensure user object has the right structure
        const normalizedUser = {
          _id: user._id || user.id,
          id: user._id || user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          organization: user.organization,
          ...user, // Keep any other properties
        };

        // For initial load, trust the stored token
        // Token validation will happen on first API call via interceptors
        dispatch({
          type: AuthActionTypes.INITIALIZE_SUCCESS,
          payload: {
            user: normalizedUser,
            organization,
            token: storedToken,
            refreshToken: null, // Now httpOnly cookie
            roleRef,
          },
        });
      } else {
        dispatch({
          type: AuthActionTypes.INITIALIZE_FAILURE,
          payload: null,
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearStoredAuth();
      dispatch({
        type: AuthActionTypes.INITIALIZE_FAILURE,
        payload: 'Authentication initialization failed.',
      });
    }
  };

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AuthActionTypes.LOGIN_START });

    try {
      const response = await authAPI.login(credentials);
      const responseData = response.data;
      
      // Handle different response structures
      let user, organization, token, refreshToken, roleRef;

      if (responseData.user) {
        // Nested structure: { user: {...}, organization: {...}, token: "..." }
        user = responseData.user;
        organization = responseData.organization;
        token = responseData.token;
        refreshToken = responseData.refreshToken;
        roleRef = responseData.roleRef || responseData.user?.roleRef || null;
      } else {
        // Direct structure: { _id, firstName, lastName, role, organization, token }
        user = {
          _id: responseData._id,
          id: responseData._id,
          firstName: responseData.firstName,
          lastName: responseData.lastName,
          email: responseData.email,
          role: responseData.role,
          organization: responseData.organization,
        };

        // Organization might be an ID or object
        organization = typeof responseData.organization === 'string'
          ? { _id: responseData.organization }
          : responseData.organization;

        token = responseData.token;
        refreshToken = responseData.refreshToken;
        roleRef = responseData.roleRef || null;
      }

      // Store auth data in localStorage (refreshToken is now httpOnly cookie — not stored)
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (organization) {
        localStorage.setItem('organization', JSON.stringify(organization));
      }
      if (roleRef) {
        localStorage.setItem('roleRef', JSON.stringify(roleRef));
      }

      dispatch({
        type: AuthActionTypes.LOGIN_SUCCESS,
        payload: {
          user,
          organization,
          token,
          refreshToken,
          roleRef,
        },
      });

      return {
        success: true,
        user,
        organization,
        redirectTo: getDashboardRoute(user.role),
      };
    } catch (error) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      dispatch({
        type: AuthActionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        status,
      };
    }
  };

  // Register function
  const register = async (registrationData) => {
    dispatch({ type: AuthActionTypes.REGISTER_START });

    try {
      const response = await authAPI.register(registrationData);
      const responseData = response.data;

      // Handle different response structures
      let user, organization, token, refreshToken, roleRef;

      if (responseData.user) {
        // Nested structure: { user: {...}, organization: {...}, token: "..." }
        user = responseData.user;
        organization = responseData.organization;
        token = responseData.token;
        refreshToken = responseData.refreshToken;
        roleRef = responseData.roleRef || responseData.user?.roleRef || null;
      } else {
        // Direct structure: { _id, firstName, lastName, role, organization, token }
        user = {
          _id: responseData._id,
          id: responseData._id,
          firstName: responseData.firstName,
          lastName: responseData.lastName,
          email: responseData.email,
          role: responseData.role,
          organization: responseData.organization,
        };

        // Organization might be an ID or object
        organization = typeof responseData.organization === 'string'
          ? { _id: responseData.organization }
          : responseData.organization;

        token = responseData.token;
        refreshToken = responseData.refreshToken;
        roleRef = responseData.roleRef || null;
      }

      // Store auth data in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('organization', JSON.stringify(organization));
      if (roleRef) {
        localStorage.setItem('roleRef', JSON.stringify(roleRef));
      }

      dispatch({
        type: AuthActionTypes.REGISTER_SUCCESS,
        payload: {
          user,
          organization,
          token,
          refreshToken,
          roleRef,
        },
      });

      return {
        success: true,
        user,
        organization,
        redirectTo: getDashboardRoute(user.role),
      };
    } catch (error) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      dispatch({
        type: AuthActionTypes.REGISTER_FAILURE,
        payload: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearStoredAuth();
      dispatch({ type: AuthActionTypes.LOGOUT });
    }
  };

  // Update user data
  const updateUser = (userData) => {
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    dispatch({
      type: AuthActionTypes.UPDATE_USER,
      payload: userData,
    });
  };

  // Update organization data
  const updateOrganization = (organizationData) => {
    const updatedOrganization = { ...state.organization, ...organizationData };
    localStorage.setItem('organization', JSON.stringify(updatedOrganization));
    dispatch({
      type: AuthActionTypes.UPDATE_ORGANIZATION,
      payload: organizationData,
    });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AuthActionTypes.CLEAR_ERROR });
  };

  // Proactive token refresh (cookie-based — no need to check state.refreshToken)
  const refreshTokenIfNeeded = async () => {
    try {
      const response = await authAPI.refresh();
      const { token } = response.data;

      localStorage.setItem('token', token);

      dispatch({
        type: AuthActionTypes.REFRESH_TOKEN_SUCCESS,
        payload: { token, refreshToken: null },
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Only force logout on auth rejection, not network blips
      if (error.response?.status === 401 || error.response?.status === 403) {
        dispatch({
          type: AuthActionTypes.REFRESH_TOKEN_FAILURE,
          payload: 'Session expired. Please login again.',
        });
      }
    }
  };

  // Clear stored authentication data
  const clearStoredAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    localStorage.removeItem('roleRef');
  };

  // Get dashboard route based on user role
  const getDashboardRoute = (userRole) => {
    switch (userRole) {
      case 'Business Head':
        return '/dashboard';
      case 'Project Director':
        return '/dashboard';
      case 'Sales Head':
      case 'Sales Manager':
        return '/dashboard';
      case 'Finance Head':
      case 'Finance Manager':
        return '/dashboard';
      case 'Sales Executive':
      case 'Channel Partner Agent':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };

  // Role-based access control functions
  const hasRole = (requiredRole) => {
    if (!state.user?.role) return false;
    return state.user.role === requiredRole;
  };

  const hasAnyRole = (requiredRoles) => {
    if (!state.user?.role) return false;
    return requiredRoles.includes(state.user.role);
  };

  const hasMinimumRole = (minimumRole) => {
    if (!state.user?.role) return false;
    const userRoleLevel = ROLE_HIERARCHY[state.user.role] || 0;
    const minimumRoleLevel = ROLE_HIERARCHY[minimumRole] || 0;
    return userRoleLevel >= minimumRoleLevel;
  };

  const hasPermission = (permissionGroup) => {
    if (!state.user?.role) return false;
    const allowedRoles = PERMISSION_GROUPS[permissionGroup] || [];
    return allowedRoles.includes(state.user.role);
  };

  // --- New module:action permission checks (dynamic system) ---
  const checkPerm = (permission) => {
    if (state.isOwner) return true;
    return (state.permissions || []).includes(permission);
  };

  const checkAnyPerm = (...perms) => {
    if (state.isOwner) return true;
    return perms.some(p => (state.permissions || []).includes(p));
  };

  const checkAllPerms = (...perms) => {
    if (state.isOwner) return true;
    return perms.every(p => (state.permissions || []).includes(p));
  };

  const canManageRoleLevel = (targetLevel) => {
    if (state.isOwner) return true;
    return (state.roleLevel ?? 100) < targetLevel;
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!state.user) return 'Guest';
    return `${state.user.firstName} ${state.user.lastName || ''}`.trim();
  };

  // Get organization display name
  const getOrganizationDisplayName = () => {
    if (!state.organization) return 'No Organization';
    return state.organization.name || 'Unknown Organization';
  };

  // Check if user can access specific features
  // Bridge: uses new module:action permissions when available, falls back to old groups
  const _useNew = state.permissions?.length > 0;
  const canAccess = {
    // Admin features
    userManagement: () => _useNew ? checkAnyPerm('users:view', 'users:update') : hasPermission('ADMIN'),
    systemSettings: () => _useNew ? checkPerm('roles:view') : hasPermission('ADMIN'),
    organizationSettings: () => _useNew ? checkPerm('roles:view') : hasPermission('ADMIN'),

    // Management features
    projectManagement: () => _useNew ? checkAnyPerm('projects:create', 'projects:update') : hasPermission('MANAGEMENT'),
    financialReports: () => _useNew ? checkAnyPerm('payments:view', 'payments:reports') : hasPermission('FINANCE'),
    salesReports: () => _useNew ? checkAnyPerm('sales:analytics', 'analytics:basic') : hasPermission('MANAGEMENT'),
    constructionManagement: () => _useNew ? checkAnyPerm('construction:view', 'construction:update') : hasPermission('CONSTRUCTION'),

    // Sales features
    leadManagement: () => _useNew ? checkPerm('leads:view') : hasPermission('SALES'),
    salesPipeline: () => _useNew ? checkPerm('sales:view') : hasPermission('SALES'),
    customerInteractions: () => _useNew ? checkAnyPerm('leads:view', 'leads:update') : hasPermission('SALES'),

    // Specific role checks
    approveDocuments: () => _useNew ? checkPerm('documents:approve') : hasMinimumRole('Sales Manager'),
    viewFinancials: () => _useNew ? checkAnyPerm('payments:view', 'invoices:view') : hasPermission('FINANCE'),
    manageContractors: () => _useNew ? checkPerm('contractors:manage') : hasPermission('CONSTRUCTION'),

    // Data access
    viewAllProjects: () => _useNew ? checkPerm('projects:view') : hasPermission('MANAGEMENT'),
    viewOwnLeads: () => _useNew ? checkPerm('leads:view') : hasPermission('SALES'),
    editPricing: () => _useNew ? checkPerm('pricing:dynamic_pricing') : hasMinimumRole('Sales Manager'),

    // Task management
    taskManagement: () => _useNew ? checkPerm('tasks:view') : true,
    taskTeamView: () => _useNew ? checkPerm('tasks:view_team') : hasPermission('MANAGEMENT'),
    taskAnalytics: () => _useNew ? checkPerm('tasks:analytics') : hasPermission('MANAGEMENT'),
    taskTemplates: () => _useNew ? checkPerm('tasks:manage_templates') : hasPermission('ADMIN'),

    // Approvals
    approvalsView: () => _useNew ? checkPerm('approvals:view') : true,
    approvalsViewAll: () => _useNew ? checkPerm('approvals:view_all') : hasPermission('MANAGEMENT'),
    approvalsApprove: () => _useNew ? checkPerm('approvals:approve') : hasPermission('MANAGEMENT'),
    approvalsReject: () => _useNew ? checkPerm('approvals:reject') : hasPermission('MANAGEMENT'),
    approvalsPolicies: () => _useNew ? checkPerm('approvals:manage_policies') : hasPermission('ADMIN'),

    // Chat & messaging
    chatAccess: () => _useNew ? checkPerm('chat:view') : true,
    chatSend: () => _useNew ? checkPerm('chat:send') : true,
    chatCreateGroup: () => _useNew ? checkPerm('chat:create_group') : hasPermission('MANAGEMENT'),
    chatDeleteAny: () => _useNew ? checkPerm('chat:delete_any') : hasPermission('ADMIN'),
  };

  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    updateOrganization,
    clearError,
    
    // Utility functions
    getUserDisplayName,
    getOrganizationDisplayName,
    getDashboardRoute,
    
    // Access control (legacy)
    hasRole,
    hasAnyRole,
    hasMinimumRole,
    hasPermission,
    canAccess,

    // Access control (new module:action system)
    checkPerm,
    checkAnyPerm,
    checkAllPerms,
    canManageRoleLevel,
    roleRef: state.roleRef,
    permissions: state.permissions,
    isOwner: state.isOwner,
    roleLevel: state.roleLevel,

    // Constants
    ROLE_HIERARCHY,
    PERMISSION_GROUPS,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Higher-order component for protected routes
export const withAuth = (WrappedComponent, requiredPermission = null) => {
  return function AuthenticatedComponent(props) {
    const auth = useAuth();
    
    // Loading state
    if (auth.isLoading || !auth.isInitialized) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          Loading...
        </div>
      );
    }
    
    // Not authenticated
    if (!auth.isAuthenticated) {
      window.location.href = '/login';
      return null;
    }
    
    // Check permission if required
    if (requiredPermission && !auth.hasPermission(requiredPermission)) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

// Hook for role-based rendering
export const useRoleAccess = () => {
  const auth = useAuth();

  return {
    // Legacy
    hasRole: auth.hasRole,
    hasAnyRole: auth.hasAnyRole,
    hasMinimumRole: auth.hasMinimumRole,
    hasPermission: auth.hasPermission,
    canAccess: auth.canAccess,
    userRole: auth.user?.role,
    isAdmin: auth.hasPermission('ADMIN'),
    isManagement: auth.hasPermission('MANAGEMENT'),
    isSales: auth.hasPermission('SALES'),
    isFinance: auth.hasPermission('FINANCE'),
    // New module:action system
    checkPerm: auth.checkPerm,
    checkAnyPerm: auth.checkAnyPerm,
    checkAllPerms: auth.checkAllPerms,
    isOwner: auth.isOwner,
    roleLevel: auth.roleLevel,
  };
};

export default AuthContext;
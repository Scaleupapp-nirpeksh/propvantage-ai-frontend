// File: src/context/AuthContext.js
// Description: Fixed Authentication Context with proper login redirect and state management
// Version: 2.0 - Enhanced with proper login flow and role-based routing
// Location: src/context/AuthContext.js

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiClient, { authAPI } from '../services/api';

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

    case AuthActionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

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
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      const tokenRefreshInterval = setInterval(() => {
        refreshTokenIfNeeded();
      }, 15 * 60 * 1000); // Check every 15 minutes

      return () => clearInterval(tokenRefreshInterval);
    }
  }, [state.isAuthenticated, state.token]);

  // Initialize authentication from stored tokens
  const initializeAuth = async () => {
    dispatch({ type: AuthActionTypes.INITIALIZE_START });

    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedOrganization = localStorage.getItem('organization');
      const storedRefreshToken = localStorage.getItem('refreshToken');

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);
        const organization = storedOrganization ? JSON.parse(storedOrganization) : null;

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
            refreshToken: storedRefreshToken,
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
      let user, organization, token, refreshToken;
      
      if (responseData.user) {
        // Nested structure: { user: {...}, organization: {...}, token: "..." }
        user = responseData.user;
        organization = responseData.organization;
        token = responseData.token;
        refreshToken = responseData.refreshToken;
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
      }

      // Store auth data in localStorage (already done in authAPI.login)
      // But let's ensure it's stored properly
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (organization) {
        localStorage.setItem('organization', JSON.stringify(organization));
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      dispatch({
        type: AuthActionTypes.LOGIN_SUCCESS,
        payload: {
          user,
          organization,
          token,
          refreshToken,
        },
      });

      return {
        success: true,
        user,
        organization,
        redirectTo: getDashboardRoute(user.role),
      };
    } catch (error) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      dispatch({
        type: AuthActionTypes.LOGIN_FAILURE,
        payload: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
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
      let user, organization, token, refreshToken;
      
      if (responseData.user) {
        // Nested structure: { user: {...}, organization: {...}, token: "..." }
        user = responseData.user;
        organization = responseData.organization;
        token = responseData.token;
        refreshToken = responseData.refreshToken;
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
      }

      // Store auth data in localStorage (already done in authAPI.register)
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('organization', JSON.stringify(organization));
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      dispatch({
        type: AuthActionTypes.REGISTER_SUCCESS,
        payload: {
          user,
          organization,
          token,
          refreshToken,
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

  // Refresh token if needed
  const refreshTokenIfNeeded = async () => {
    try {
      if (state.refreshToken) {
        const response = await authAPI.refresh();
        const { token, refreshToken } = response.data;
        
        localStorage.setItem('token', token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        
        dispatch({
          type: AuthActionTypes.REFRESH_TOKEN_SUCCESS,
          payload: { token, refreshToken },
        });
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      dispatch({
        type: AuthActionTypes.REFRESH_TOKEN_FAILURE,
        payload: 'Session expired. Please login again.',
      });
    }
  };

  // Clear stored authentication data
  const clearStoredAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
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
  const canAccess = {
    // Admin features
    userManagement: () => hasPermission('ADMIN'),
    systemSettings: () => hasPermission('ADMIN'),
    organizationSettings: () => hasPermission('ADMIN'),
    
    // Management features
    projectManagement: () => hasPermission('MANAGEMENT'),
    financialReports: () => hasPermission('FINANCE'),
    salesReports: () => hasPermission('MANAGEMENT'),
    constructionManagement: () => hasPermission('CONSTRUCTION'),
    
    // Sales features
    leadManagement: () => hasPermission('SALES'),
    salesPipeline: () => hasPermission('SALES'),
    customerInteractions: () => hasPermission('SALES'),
    
    // Specific role checks
    approveDocuments: () => hasMinimumRole('Sales Manager'),
    viewFinancials: () => hasPermission('FINANCE'),
    manageContractors: () => hasPermission('CONSTRUCTION'),
    
    // Data access
    viewAllProjects: () => hasPermission('MANAGEMENT'),
    viewOwnLeads: () => hasPermission('SALES'),
    editPricing: () => hasMinimumRole('Sales Manager'),
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
    
    // Access control
    hasRole,
    hasAnyRole,
    hasMinimumRole,
    hasPermission,
    canAccess,
    
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
  };
};

export default AuthContext;
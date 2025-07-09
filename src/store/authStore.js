//src/store/authStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '../services/api'
import { message } from 'antd'

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      organization: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.login(credentials)
          const { token, user, organization } = response.data

          // Store token in localStorage
          localStorage.setItem('propvantage_token', token)
          localStorage.setItem('propvantage_user', JSON.stringify(user))

          set({
            user,
            organization,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          message.success(`Welcome back, ${user.firstName}!`)
          return { success: true, user, organization }

        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed'
          set({
            user: null,
            organization: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })
          message.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      register: async (organizationData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.register(organizationData)
          const { token, user, organization } = response.data

          // Store token in localStorage
          localStorage.setItem('propvantage_token', token)
          localStorage.setItem('propvantage_user', JSON.stringify(user))

          set({
            user,
            organization,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })

          message.success('Organization registered successfully!')
          return { success: true, user, organization }

        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Registration failed'
          set({
            user: null,
            organization: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          })
          message.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      logout: () => {
        // Clear localStorage
        localStorage.removeItem('propvantage_token')
        localStorage.removeItem('propvantage_user')

        set({
          user: null,
          organization: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })

        message.success('Logged out successfully')
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.updateProfile(profileData)
          const updatedUser = response.data.data || response.data.user

          // Update localStorage
          localStorage.setItem('propvantage_user', JSON.stringify(updatedUser))

          set({
            user: updatedUser,
            isLoading: false,
            error: null,
          })

          message.success('Profile updated successfully')
          return { success: true, user: updatedUser }

        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Profile update failed'
          set({
            isLoading: false,
            error: errorMessage,
          })
          message.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      changePassword: async (passwordData) => {
        set({ isLoading: true, error: null })
        
        try {
          await authAPI.changePassword(passwordData)

          set({
            isLoading: false,
            error: null,
          })

          message.success('Password changed successfully')
          return { success: true }

        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Password change failed'
          set({
            isLoading: false,
            error: errorMessage,
          })
          message.error(errorMessage)
          return { success: false, error: errorMessage }
        }
      },

      // Initialize auth state from localStorage
      initializeAuth: () => {
        const token = localStorage.getItem('propvantage_token')
        const userStr = localStorage.getItem('propvantage_user')

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr)
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } catch (error) {
            // Clear corrupted data
            localStorage.removeItem('propvantage_token')
            localStorage.removeItem('propvantage_user')
            set({
              user: null,
              organization: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            })
          }
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Check if user has specific role
      hasRole: (role) => {
        const { user } = get()
        return user?.role === role
      },

      // Check if user has any of the specified roles
      hasAnyRole: (roles) => {
        const { user } = get()
        return roles.includes(user?.role)
      },

      // Check if user is admin/management
      isManagement: () => {
        const { user } = get()
        const managementRoles = [
          'Business Head',
          'Project Director', 
          'Sales Head',
          'Finance Head',
          'Marketing Head',
          'Sales Manager',
          'Finance Manager',
          'Channel Partner Manager'
        ]
        return managementRoles.includes(user?.role)
      },

      // Check if user is sales role
      isSalesRole: () => {
        const { user } = get()
        const salesRoles = [
          'Sales Head',
          'Sales Manager',
          'Sales Executive',
          'Channel Partner Manager',
          'Channel Partner Admin',
          'Channel Partner Agent'
        ]
        return salesRoles.includes(user?.role)
      },

      // Get user permissions based on role
      getPermissions: () => {
        const { user } = get()
        if (!user) return []

        const rolePermissions = {
          'Business Head': ['all'],
          'Project Director': ['project_management', 'construction', 'analytics'],
          'Sales Head': ['sales_management', 'lead_management', 'team_management', 'analytics'],
          'Finance Head': ['financial_management', 'payment_management', 'analytics'],
          'Marketing Head': ['marketing', 'lead_management', 'analytics'],
          'Sales Manager': ['sales_management', 'lead_management', 'unit_management'],
          'Finance Manager': ['financial_management', 'payment_management'],
          'Channel Partner Manager': ['partner_management', 'lead_management'],
          'Sales Executive': ['lead_management', 'customer_management'],
          'Channel Partner Admin': ['partner_operations', 'lead_management'],
          'Channel Partner Agent': ['lead_capture', 'customer_interaction']
        }

        return rolePermissions[user.role] || []
      },

      // Check if user has specific permission
      hasPermission: (permission) => {
        const permissions = get().getPermissions()
        return permissions.includes('all') || permissions.includes(permission)
      },
    }),
    {
      name: 'propvantage-auth',
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
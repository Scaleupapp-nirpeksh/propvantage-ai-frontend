//src/store/appStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set, get) => ({
      // UI State
      sidebarCollapsed: false,
      theme: 'light', // 'light' | 'dark'
      pageLoading: false,
      
      // Current selections (for filtering and context)
      currentProject: null,
      currentTower: null,
      selectedUnits: [],
      selectedLeads: [],
      
      // Filters and search
      projectFilters: {
        status: 'all',
        type: 'all',
        location: 'all',
      },
      leadFilters: {
        status: 'all',
        assignedTo: 'all',
        source: 'all',
        project: 'all',
        dateRange: null,
      },
      unitFilters: {
        status: 'all',
        type: 'all',
        tower: 'all',
        priceRange: [0, 50000000],
        floor: 'all',
      },
      searchQuery: '',
      
      // Dashboard preferences
      dashboardLayout: 'default',
      favoriteReports: [],
      
      // Recent activities and breadcrumbs
      recentProjects: [],
      recentLeads: [],
      breadcrumbs: [],
      
      // Notification preferences
      notifications: {
        email: true,
        push: true,
        leadUpdates: true,
        paymentReminders: true,
        milestoneAlerts: true,
      },

      // Actions for UI state
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
      
      setTheme: (theme) => set({ theme }),
      
      setPageLoading: (loading) => set({ pageLoading: loading }),

      // Actions for current selections
      setCurrentProject: (project) => {
        set({ 
          currentProject: project,
          currentTower: null, // Reset tower when project changes
        })
        
        // Add to recent projects
        const { recentProjects } = get()
        if (project) {
          const updatedRecent = [
            project,
            ...recentProjects.filter(p => p._id !== project._id)
          ].slice(0, 5) // Keep only 5 recent
          
          set({ recentProjects: updatedRecent })
        }
      },
      
      setCurrentTower: (tower) => set({ currentTower: tower }),
      
      setSelectedUnits: (units) => set({ selectedUnits: units }),
      
      addSelectedUnit: (unit) => set((state) => {
        const isSelected = state.selectedUnits.find(u => u._id === unit._id)
        if (isSelected) return state
        
        return {
          selectedUnits: [...state.selectedUnits, unit]
        }
      }),
      
      removeSelectedUnit: (unitId) => set((state) => ({
        selectedUnits: state.selectedUnits.filter(u => u._id !== unitId)
      })),
      
      clearSelectedUnits: () => set({ selectedUnits: [] }),
      
      setSelectedLeads: (leads) => set({ selectedLeads: leads }),
      
      addSelectedLead: (lead) => set((state) => {
        const isSelected = state.selectedLeads.find(l => l._id === lead._id)
        if (isSelected) return state
        
        return {
          selectedLeads: [...state.selectedLeads, lead]
        }
      }),
      
      removeSelectedLead: (leadId) => set((state) => ({
        selectedLeads: state.selectedLeads.filter(l => l._id !== leadId)
      })),
      
      clearSelectedLeads: () => set({ selectedLeads: [] }),

      // Actions for filters
      setProjectFilters: (filters) => set((state) => ({
        projectFilters: { ...state.projectFilters, ...filters }
      })),
      
      setLeadFilters: (filters) => set((state) => ({
        leadFilters: { ...state.leadFilters, ...filters }
      })),
      
      setUnitFilters: (filters) => set((state) => ({
        unitFilters: { ...state.unitFilters, ...filters }
      })),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      clearAllFilters: () => set({
        projectFilters: {
          status: 'all',
          type: 'all',
          location: 'all',
        },
        leadFilters: {
          status: 'all',
          assignedTo: 'all',
          source: 'all',
          project: 'all',
          dateRange: null,
        },
        unitFilters: {
          status: 'all',
          type: 'all',
          tower: 'all',
          priceRange: [0, 50000000],
          floor: 'all',
        },
        searchQuery: '',
      }),

      // Actions for dashboard
      setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
      
      addFavoriteReport: (report) => set((state) => {
        if (state.favoriteReports.find(r => r.id === report.id)) {
          return state // Already exists
        }
        return {
          favoriteReports: [...state.favoriteReports, report]
        }
      }),
      
      removeFavoriteReport: (reportId) => set((state) => ({
        favoriteReports: state.favoriteReports.filter(r => r.id !== reportId)
      })),

      // Actions for recent activities
      addRecentLead: (lead) => set((state) => {
        const updatedRecent = [
          lead,
          ...state.recentLeads.filter(l => l._id !== lead._id)
        ].slice(0, 10) // Keep only 10 recent
        
        return { recentLeads: updatedRecent }
      }),

      // Actions for breadcrumbs
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
      
      addBreadcrumb: (breadcrumb) => set((state) => ({
        breadcrumbs: [...state.breadcrumbs, breadcrumb]
      })),
      
      clearBreadcrumbs: () => set({ breadcrumbs: [] }),

      // Actions for notifications
      setNotificationSettings: (settings) => set((state) => ({
        notifications: { ...state.notifications, ...settings }
      })),

      // Utility getters
      getActiveFiltersCount: () => {
        const { projectFilters, leadFilters, unitFilters, searchQuery } = get()
        let count = 0
        
        // Count active project filters
        Object.values(projectFilters).forEach(value => {
          if (value !== 'all' && value !== null) count++
        })
        
        // Count active lead filters
        Object.values(leadFilters).forEach(value => {
          if (value !== 'all' && value !== null) count++
        })
        
        // Count active unit filters
        Object.entries(unitFilters).forEach(([key, value]) => {
          if (key === 'priceRange') {
            if (value[0] > 0 || value[1] < 50000000) count++
          } else if (value !== 'all' && value !== null) {
            count++
          }
        })
        
        // Count search query
        if (searchQuery.trim()) count++
        
        return count
      },
      
      // Check if any items are selected
      hasSelections: () => {
        const { selectedUnits, selectedLeads } = get()
        return selectedUnits.length > 0 || selectedLeads.length > 0
      },
      
      // Get current context for API calls
      getCurrentContext: () => {
        const { currentProject, currentTower } = get()
        return {
          projectId: currentProject?._id,
          towerId: currentTower?._id,
        }
      },

      // Reset entire app state (useful for logout)
      resetAppState: () => set({
        currentProject: null,
        currentTower: null,
        selectedUnits: [],
        selectedLeads: [],
        searchQuery: '',
        breadcrumbs: [],
      }),
    }),
    {
      name: 'propvantage-app',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        dashboardLayout: state.dashboardLayout,
        favoriteReports: state.favoriteReports,
        notifications: state.notifications,
        recentProjects: state.recentProjects,
        recentLeads: state.recentLeads,
      }),
    }
  )
)

export default useAppStore
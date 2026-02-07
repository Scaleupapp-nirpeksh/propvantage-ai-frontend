/**
 * Coach mark flow definitions.
 * Each flow is an array of steps with target selectors, titles, and descriptions.
 * Targets use `data-coach` attributes added to key UI elements.
 */

const FLOWS = {
  // Dashboard onboarding flow
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard Tour',
    steps: [
      {
        target: '[data-coach="sidebar-nav"]',
        title: 'Navigation',
        description: 'Use the sidebar to navigate between different sections of the platform. You can collapse it for more space.',
        placement: 'right',
      },
      {
        target: '[data-coach="search-shortcut"]',
        title: 'Quick Search',
        description: 'Press Cmd+K (or Ctrl+K) to instantly search any page or action. Try it!',
        placement: 'right',
      },
      {
        target: '[data-coach="kpi-cards"]',
        title: 'Key Metrics',
        description: 'These cards show your most important metrics at a glance. Click any card to dive deeper into the data.',
        placement: 'bottom',
      },
      {
        target: '[data-coach="quick-create"]',
        title: 'Quick Actions',
        description: 'Use the + button to quickly create leads, sales, or record payments from anywhere.',
        placement: 'bottom',
      },
    ],
  },

  // Leads management flow
  leads: {
    id: 'leads',
    name: 'Leads Guide',
    steps: [
      {
        target: '[data-coach="filter-bar"]',
        title: 'Filter & Search',
        description: 'Use filters to narrow down leads by status, priority, source, or project. The search bar supports fuzzy matching.',
        placement: 'bottom',
      },
      {
        target: '[data-coach="data-table"]',
        title: 'Lead Table',
        description: 'Click any row to view full details. On mobile, leads show as cards. Use the menu icon for quick actions like call, email, or edit.',
        placement: 'top',
      },
      {
        target: '[data-coach="kpi-cards"]',
        title: 'Lead Summary',
        description: 'Track total leads, hot leads (score 90+), overdue follow-ups, and new leads today — all in real time.',
        placement: 'bottom',
      },
    ],
  },

  // Sales flow
  sales: {
    id: 'sales',
    name: 'Sales Guide',
    steps: [
      {
        target: '[data-coach="kpi-cards"]',
        title: 'Sales Overview',
        description: 'Monitor total sales, revenue, monthly performance, and average sale value. Click a card to see detailed analytics.',
        placement: 'bottom',
      },
      {
        target: '[data-coach="filter-bar"]',
        title: 'Advanced Filters',
        description: 'Filter by status, payment status, project, or salesperson. Combine multiple filters for precise results.',
        placement: 'bottom',
      },
      {
        target: '[data-coach="data-table"]',
        title: 'Sales Records',
        description: 'Each row shows the customer, project, amount, and status. Use the action menu to view, edit, or manage payment plans.',
        placement: 'top',
      },
    ],
  },

  // Analytics flow
  analytics: {
    id: 'analytics',
    name: 'Analytics Guide',
    steps: [
      {
        target: '[data-coach="period-selector"]',
        title: 'Time Period',
        description: 'Select different time periods to compare performance across months, quarters, or custom date ranges.',
        placement: 'bottom',
      },
      {
        target: '[data-coach="chart-card"]',
        title: 'Interactive Charts',
        description: 'Hover over charts for detailed data points. Click chart legends to toggle data series on and off.',
        placement: 'bottom',
      },
    ],
  },
};

export default FLOWS;

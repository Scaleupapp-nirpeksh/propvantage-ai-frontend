// Task Management constants — state machine, categories, kanban columns, colors

// Valid status transitions (state machine)
export const STATUS_TRANSITIONS = {
  'Open': ['In Progress', 'On Hold', 'Cancelled'],
  'In Progress': ['Under Review', 'On Hold', 'Cancelled', 'Completed'],
  'Under Review': ['In Progress', 'Completed', 'On Hold'],
  'On Hold': ['Open', 'In Progress', 'Cancelled'],
  'Completed': ['Open'],
  'Cancelled': ['Open'],
};

// Task categories
export const TASK_CATEGORIES = [
  'Lead & Sales',
  'Payment & Collection',
  'Construction',
  'Document & Compliance',
  'Customer Service',
  'Approval',
  'General',
];

// Priority options
export const TASK_PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

// Linked entity types
export const LINKED_ENTITY_TYPES = [
  'Lead', 'Sale', 'PaymentPlan', 'PaymentTransaction', 'Installment',
  'Invoice', 'ConstructionMilestone', 'Project', 'Unit', 'Contractor', 'User', 'File',
];

// Entity type → route prefix mapping for linked entity navigation
export const ENTITY_ROUTE_MAP = {
  Lead: '/leads',
  Sale: '/sales',
  Project: '/projects',
  Invoice: '/sales/invoices',
  Installment: '/payments/installments',
  ConstructionMilestone: '/construction/milestones',
  Unit: '/projects', // needs project context
};

// Escalation level color mapping
export const ESCALATION_COLORS = {
  1: '#ED6C02', // warning orange
  2: '#EF6C00', // deeper orange
  3: '#D32F2F', // red
};

// Kanban board column config
export const KANBAN_COLUMNS = [
  { id: 'Open', label: 'Open', color: '#3B82F6' },
  { id: 'In Progress', label: 'In Progress', color: '#F59E0B' },
  { id: 'Under Review', label: 'Under Review', color: '#8B5CF6' },
  { id: 'Completed', label: 'Completed', color: '#10B981' },
  { id: 'On Hold', label: 'On Hold', color: '#6B7280' },
];

// Priority colors for borders, dots, etc.
export const PRIORITY_COLORS = {
  Critical: '#DC2626',
  High: '#EA580C',
  Medium: '#CA8A04',
  Low: '#16A34A',
};

// Recurrence patterns
export const RECURRENCE_PATTERNS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

// Category icons (MUI icon name strings for dynamic rendering)
export const CATEGORY_COLORS = {
  'Lead & Sales': '#1e88e5',
  'Payment & Collection': '#43a047',
  'Construction': '#fb8c00',
  'Document & Compliance': '#8e24aa',
  'Customer Service': '#00acc1',
  'Approval': '#e53935',
  'General': '#546e7a',
};

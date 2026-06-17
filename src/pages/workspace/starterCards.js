// src/pages/workspace/starterCards.js
// Role-based starter card definitions for the Workspace empty state.
// Each definition mirrors the WorkspaceCard create payload (minus ownership/ids):
// { title, module, queryPlan, renderMode, metricConfig }.
// queryPlan shape (see workspace spec §3.3):
//   { module, logic:'AND', filters:[{field,op,value}], sort:{field,dir}|null, limit, nlSource }

const plan = (module, filters, sort = null, limit = 50) => ({
  module,
  logic: 'AND',
  filters,
  sort,
  limit,
  nlSource: null,
});

const listCard = (title, module, filters, sort, limit) => ({
  title,
  module,
  renderMode: 'list',
  metricConfig: { agg: 'count', field: null },
  queryPlan: plan(module, filters, sort, limit),
});

const metricCard = (title, module, filters) => ({
  title,
  module,
  renderMode: 'metric',
  metricConfig: { agg: 'count', field: null },
  queryPlan: plan(module, filters, null, 1),
});

const metricSumCard = (title, module, field, filters) => ({
  title,
  module,
  renderMode: 'metric',
  metricConfig: { agg: 'sum', field },
  queryPlan: plan(module, filters, null, 1),
});

// chartConfig: { chartType, groupBy, agg:'count'|'sum', metricField, timeBucket }
const chartCard = (title, module, chartConfig, filters = []) => ({
  title,
  module,
  renderMode: 'chart',
  chartConfig: { agg: 'count', metricField: null, timeBucket: null, ...chartConfig },
  queryPlan: plan(module, filters, null, 50),
});

// Dashboard-derived suggested cards — mirror dashboard KPIs and use only
// fields the catalogs expose. Returned for all roles (role param reserved for
// future personalisation).
const SUGGESTED = [
  metricSumCard(
    'Revenue booked (90d)',
    'sales',
    'salePrice',
    [{ field: 'bookingDate', op: 'lastNDays', value: 90 }],
  ),
  metricCard(
    'Bookings (30d)',
    'sales',
    [
      { field: 'status', op: 'is', value: 'Booked' },
      { field: 'bookingDate', op: 'lastNDays', value: 30 },
    ],
  ),
  metricCard(
    'Payments received (30d)',
    'payments',
    [
      { field: 'status', op: 'in', value: ['completed', 'cleared'] },
      { field: 'paymentDate', op: 'lastNDays', value: 30 },
    ],
  ),
  listCard(
    'Stale CP leads (20d)',
    'leads',
    [
      { field: 'channelPartner', op: 'isNotEmpty', value: null },
      { field: 'daysSinceLastCPFollowUp', op: 'gte', value: 20 },
    ],
    { field: 'daysSinceLastCPFollowUp', dir: 'desc' },
  ),
  listCard(
    'Overdue tasks',
    'tasks',
    [{ field: 'daysOverdue', op: 'gt', value: 0 }],
    { field: 'daysOverdue', dir: 'desc' },
  ),
  chartCard('Leads by status', 'leads', { chartType: 'funnel', groupBy: 'status' }),
  chartCard('Leads by source', 'leads', { chartType: 'pie', groupBy: 'source' }),
  chartCard('Bookings by status', 'sales', { chartType: 'bar', groupBy: 'status' }),
  chartCard('Revenue by month', 'sales', {
    chartType: 'line', groupBy: 'bookingDate', agg: 'sum', metricField: 'salePrice', timeBucket: 'month',
  }),
];

/**
 * Return the dashboard-derived suggested card definitions.
 * The role param is reserved for future personalisation; currently the same
 * set is returned for all roles.
 * @param {string} [_role]
 * @returns {Array<object>}
 */
// eslint-disable-next-line no-unused-vars
export const getSuggestedCards = (_role) => SUGGESTED;

// Generic fallback set — useful to any persona.
const GENERIC = [
  listCard(
    'My open leads',
    'leads',
    [{ field: 'assignedToMe', op: 'is', value: true }],
    { field: 'daysInCurrentStatus', dir: 'desc' },
  ),
  listCard(
    'My tasks due soon',
    'tasks',
    [
      { field: 'assignedToMe', op: 'is', value: true },
      { field: 'dueDate', op: 'lastNDays', value: 7 },
    ],
    { field: 'dueDate', dir: 'asc' },
  ),
];

// Map of role name → starter card definitions.
export const STARTER_CARDS = {
  'Sales Manager': [
    listCard(
      'Stale CP leads',
      'leads',
      [
        { field: 'source', op: 'is', value: 'Channel Partner' },
        { field: 'daysSinceLastCPFollowUp', op: 'gte', value: 15 },
      ],
      { field: 'daysSinceLastCPFollowUp', dir: 'desc' },
    ),
    listCard(
      'Bookings pending approval',
      'sales',
      [{ field: 'status', op: 'is', value: 'Pending Approval' }],
      { field: 'daysInCurrentStatus', dir: 'desc' },
    ),
    listCard(
      'Recent site visits',
      'leads',
      [
        { field: 'status', op: 'is', value: 'Site Visit Completed' },
        { field: 'daysInCurrentStatus', op: 'lte', value: 7 },
      ],
      { field: 'daysInCurrentStatus', dir: 'asc' },
    ),
  ],
  'Sales Head': [
    metricCard('Open leads', 'leads', [
      { field: 'status', op: 'notIn', value: ['Booked', 'Lost'] },
    ]),
    listCard(
      'Bookings pending approval',
      'sales',
      [{ field: 'status', op: 'is', value: 'Pending Approval' }],
      { field: 'daysInCurrentStatus', dir: 'desc' },
    ),
  ],
  'Finance Head': [
    listCard(
      'Overdue payments',
      'payments',
      [{ field: 'daysOverdue', op: 'gt', value: 0 }],
      { field: 'daysOverdue', dir: 'desc' },
    ),
    listCard(
      'Pending payments',
      'payments',
      [{ field: 'status', op: 'is', value: 'pending' }],
      { field: 'daysOverdue', dir: 'desc' },
    ),
  ],
  'Finance Manager': [
    listCard(
      'Overdue payments',
      'payments',
      [{ field: 'daysOverdue', op: 'gt', value: 0 }],
      { field: 'daysOverdue', dir: 'desc' },
    ),
  ],
  'Business Head': [
    metricCard('Bookings pending approval', 'sales', [
      { field: 'status', op: 'is', value: 'Pending Approval' },
    ]),
    metricCard('Overdue payments', 'payments', [
      { field: 'daysOverdue', op: 'gt', value: 0 },
    ]),
  ],
  'Project Director': [
    metricCard('Open leads', 'leads', [
      { field: 'status', op: 'notIn', value: ['Booked', 'Lost'] },
    ]),
    listCard(
      'Bookings pending approval',
      'sales',
      [{ field: 'status', op: 'is', value: 'Pending Approval' }],
      { field: 'daysInCurrentStatus', dir: 'desc' },
    ),
  ],
  'Sales Executive': [
    listCard(
      'My open leads',
      'leads',
      [{ field: 'assignedToMe', op: 'is', value: true }],
      { field: 'daysInCurrentStatus', dir: 'desc' },
    ),
    listCard(
      'My stale leads',
      'leads',
      [
        { field: 'assignedToMe', op: 'is', value: true },
        { field: 'daysInCurrentStatus', op: 'gte', value: 10 },
      ],
      { field: 'daysInCurrentStatus', dir: 'desc' },
    ),
  ],
};

/**
 * Resolve the starter card definitions for a role name, falling back to a
 * generic set when the role has no curated starters.
 * @param {string} roleName
 * @returns {Array<object>}
 */
export const getStarterCardsForRole = (roleName) => {
  if (roleName && STARTER_CARDS[roleName]) return STARTER_CARDS[roleName];
  return GENERIC;
};

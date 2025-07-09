// =============================================================================
// USER ROLES AND PERMISSIONS
//src/constants/index.js
// =============================================================================

export const USER_ROLES = {
    BUSINESS_HEAD: 'Business Head',
    PROJECT_DIRECTOR: 'Project Director',
    SALES_HEAD: 'Sales Head',
    FINANCE_HEAD: 'Finance Head',
    MARKETING_HEAD: 'Marketing Head',
    SALES_MANAGER: 'Sales Manager',
    FINANCE_MANAGER: 'Finance Manager',
    CHANNEL_PARTNER_MANAGER: 'Channel Partner Manager',
    SALES_EXECUTIVE: 'Sales Executive',
    CHANNEL_PARTNER_ADMIN: 'Channel Partner Admin',
    CHANNEL_PARTNER_AGENT: 'Channel Partner Agent',
  }
  
  export const ROLE_CATEGORIES = {
    MANAGEMENT: [
      USER_ROLES.BUSINESS_HEAD,
      USER_ROLES.PROJECT_DIRECTOR,
      USER_ROLES.SALES_HEAD,
      USER_ROLES.FINANCE_HEAD,
      USER_ROLES.MARKETING_HEAD,
      USER_ROLES.SALES_MANAGER,
      USER_ROLES.FINANCE_MANAGER,
      USER_ROLES.CHANNEL_PARTNER_MANAGER,
    ],
    SALES: [
      USER_ROLES.SALES_HEAD,
      USER_ROLES.SALES_MANAGER,
      USER_ROLES.SALES_EXECUTIVE,
      USER_ROLES.CHANNEL_PARTNER_MANAGER,
      USER_ROLES.CHANNEL_PARTNER_ADMIN,
      USER_ROLES.CHANNEL_PARTNER_AGENT,
    ],
    FINANCE: [
      USER_ROLES.FINANCE_HEAD,
      USER_ROLES.FINANCE_MANAGER,
    ],
    EXECUTIVES: [
      USER_ROLES.SALES_EXECUTIVE,
      USER_ROLES.CHANNEL_PARTNER_ADMIN,
      USER_ROLES.CHANNEL_PARTNER_AGENT,
    ],
  }
  
  // =============================================================================
  // PROJECT STATUS AND TYPES
  // =============================================================================
  
  export const PROJECT_TYPES = {
    VILLA: 'villa',
    TOWNSHIP: 'township',
    APARTMENT: 'apartment',
    LUXURY_APARTMENT: 'luxury_apartment',
    COMMERCIAL: 'commercial',
    PLOTTED_DEVELOPMENT: 'plotted_development',
  }
  
  export const PROJECT_STATUS = {
    PLANNING: 'planning',
    PRE_LAUNCH: 'pre_launch',
    LAUNCHED: 'launched',
    UNDER_CONSTRUCTION: 'under_construction',
    READY_TO_MOVE: 'ready_to_move',
    COMPLETED: 'completed',
    ON_HOLD: 'on_hold',
  }
  
  // =============================================================================
  // UNIT TYPES AND STATUS
  // =============================================================================
  
  export const UNIT_TYPES = {
    '1BHK': '1BHK',
    '2BHK': '2BHK',
    '3BHK': '3BHK',
    '3BHK_STUDY': '3BHK+Study',
    '4BHK': '4BHK',
    '5BHK': '5BHK',
    PENTHOUSE: 'Penthouse',
    VILLA: 'Villa',
    PLOT: 'Plot',
    COMMERCIAL: 'Commercial',
  }
  
  export const UNIT_STATUS = {
    AVAILABLE: 'available',
    BOOKED: 'booked',
    SOLD: 'sold',
    BLOCKED: 'blocked',
    HOLD: 'hold',
  }
  
  export const UNIT_FACING = {
    NORTH: 'North',
    SOUTH: 'South',
    EAST: 'East',
    WEST: 'West',
    NORTH_EAST: 'North-East',
    NORTH_WEST: 'North-West',
    SOUTH_EAST: 'South-East',
    SOUTH_WEST: 'South-West',
  }
  
  // =============================================================================
  // LEAD STATUS AND SOURCES
  // =============================================================================
  
  export const LEAD_STATUS = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    SITE_VISIT_SCHEDULED: 'Site Visit Scheduled',
    SITE_VISIT_COMPLETED: 'Site Visit Completed',
    NEGOTIATION: 'Negotiation',
    PROPOSAL_SENT: 'Proposal Sent',
    FOLLOW_UP: 'Follow Up',
    BOOKED: 'Booked',
    NOT_INTERESTED: 'Not Interested',
    LOST: 'Lost',
  }
  
  export const LEAD_SOURCES = {
    WEBSITE: 'Website',
    WALK_IN: 'Walk-in',
    REFERRAL: 'Referral',
    SOCIAL_MEDIA: 'Social Media',
    GOOGLE_ADS: 'Google Ads',
    FACEBOOK_ADS: 'Facebook Ads',
    BROKER: 'Broker',
    EXHIBITION: 'Exhibition',
    PRINT_MEDIA: 'Print Media',
    COLD_CALL: 'Cold Call',
    EMAIL_CAMPAIGN: 'Email Campaign',
    OTHER: 'Other',
  }
  
  export const LEAD_PRIORITY = {
    HOT: 'Hot',
    WARM: 'Warm',
    COLD: 'Cold',
  }
  
  export const QUALIFICATION_STATUS = {
    QUALIFIED: 'Qualified',
    UNQUALIFIED: 'Unqualified',
    PENDING: 'Pending',
  }
  
  // =============================================================================
  // INTERACTION TYPES
  // =============================================================================
  
  export const INTERACTION_TYPES = {
    CALL: 'Call',
    EMAIL: 'Email',
    MEETING: 'Meeting',
    SITE_VISIT: 'Site Visit',
    WHATSAPP: 'WhatsApp',
    SMS: 'SMS',
    FOLLOW_UP: 'Follow Up',
    PROPOSAL: 'Proposal',
    NEGOTIATION: 'Negotiation',
    DOCUMENTATION: 'Documentation',
    OTHER: 'Other',
  }
  
  export const INTERACTION_OUTCOMES = {
    POSITIVE: 'Positive',
    NEUTRAL: 'Neutral',
    NEGATIVE: 'Negative',
    NO_RESPONSE: 'No Response',
    INTERESTED: 'Interested',
    NOT_INTERESTED: 'Not Interested',
    CALLBACK_REQUESTED: 'Callback Requested',
    SITE_VISIT_SCHEDULED: 'Site Visit Scheduled',
    PROPOSAL_REQUESTED: 'Proposal Requested',
  }
  
  // =============================================================================
  // PAYMENT AND FINANCIAL
  // =============================================================================
  
  export const PAYMENT_STATUS = {
    PENDING: 'pending',
    DUE: 'due',
    PAID: 'paid',
    OVERDUE: 'overdue',
    PARTIAL: 'partial',
    WAIVED: 'waived',
  }
  
  export const PAYMENT_METHODS = {
    CASH: 'Cash',
    CHEQUE: 'Cheque',
    DEMAND_DRAFT: 'Demand Draft',
    NEFT: 'NEFT',
    RTGS: 'RTGS',
    UPI: 'UPI',
    CREDIT_CARD: 'Credit Card',
    DEBIT_CARD: 'Debit Card',
    ONLINE_TRANSFER: 'Online Transfer',
  }
  
  export const TRANSACTION_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    CLEARED: 'cleared',
  }
  
  // =============================================================================
  // CONSTRUCTION AND MILESTONES
  // =============================================================================
  
  export const MILESTONE_STATUS = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    DELAYED: 'delayed',
    ON_HOLD: 'on_hold',
  }
  
  export const MILESTONE_CATEGORIES = {
    FOUNDATION: 'Foundation',
    STRUCTURE: 'Structure',
    ROOFING: 'Roofing',
    PLUMBING: 'Plumbing',
    ELECTRICAL: 'Electrical',
    FLOORING: 'Flooring',
    PAINTING: 'Painting',
    FINISHING: 'Finishing',
    LANDSCAPING: 'Landscaping',
    HANDOVER: 'Handover',
  }
  
  export const CONSTRUCTION_PHASES = {
    PRE_CONSTRUCTION: 'Pre Construction',
    FOUNDATION: 'Foundation',
    STRUCTURE: 'Structure',
    FINISHING: 'Finishing',
    COMPLETION: 'Completion',
  }
  
  // =============================================================================
  // AMENITIES
  // =============================================================================
  
  export const AMENITY_CATEGORIES = {
    RECREATIONAL: 'Recreational',
    FITNESS: 'Fitness',
    SECURITY: 'Security',
    CONVENIENCE: 'Convenience',
    TRANSPORTATION: 'Transportation',
    ENVIRONMENTAL: 'Environmental',
    CHILDREN: 'Children',
  }
  
  export const COMMON_AMENITIES = {
    SWIMMING_POOL: 'Swimming Pool',
    GYM: 'Gymnasium',
    CLUBHOUSE: 'Clubhouse',
    GARDEN: 'Garden',
    PARKING: 'Parking',
    SECURITY: '24/7 Security',
    CCTV: 'CCTV Surveillance',
    POWER_BACKUP: 'Power Backup',
    WATER_SUPPLY: '24/7 Water Supply',
    INTERNET: 'High-Speed Internet',
    PLAYGROUND: 'Children\'s Playground',
    JOGGING_TRACK: 'Jogging Track',
    TENNIS_COURT: 'Tennis Court',
    BASKETBALL_COURT: 'Basketball Court',
    LIBRARY: 'Library',
    PARTY_HALL: 'Party Hall',
    GUEST_ROOMS: 'Guest Rooms',
    SHOPPING_CENTER: 'Shopping Center',
    SCHOOL: 'School',
    HOSPITAL: 'Hospital',
  }
  
  // =============================================================================
  // DASHBOARD AND ANALYTICS
  // =============================================================================
  
  export const DASHBOARD_WIDGETS = {
    TOTAL_PROJECTS: 'total_projects',
    TOTAL_UNITS: 'total_units',
    TOTAL_LEADS: 'total_leads',
    TOTAL_SALES: 'total_sales',
    REVENUE_THIS_MONTH: 'revenue_this_month',
    LEAD_CONVERSION_RATE: 'lead_conversion_rate',
    INVENTORY_STATUS: 'inventory_status',
    SALES_PIPELINE: 'sales_pipeline',
    PAYMENT_COLLECTIONS: 'payment_collections',
    CONSTRUCTION_PROGRESS: 'construction_progress',
  }
  
  export const CHART_TYPES = {
    BAR: 'bar',
    LINE: 'line',
    PIE: 'pie',
    DOUGHNUT: 'doughnut',
    AREA: 'area',
    COLUMN: 'column',
  }
  
  export const DATE_RANGES = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    LAST_7_DAYS: 'last_7_days',
    LAST_30_DAYS: 'last_30_days',
    THIS_MONTH: 'this_month',
    LAST_MONTH: 'last_month',
    THIS_QUARTER: 'this_quarter',
    LAST_QUARTER: 'last_quarter',
    THIS_YEAR: 'this_year',
    LAST_YEAR: 'last_year',
    CUSTOM: 'custom',
  }
  
  // =============================================================================
  // UI AND DISPLAY
  // =============================================================================
  
  export const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
  }
  
  export const PAGE_SIZES = [10, 20, 50, 100]
  
  export const SORT_ORDERS = {
    ASC: 'asc',
    DESC: 'desc',
  }
  
  // =============================================================================
  // STATUS COLORS FOR UI
  // =============================================================================
  
  export const STATUS_COLORS = {
    // Project Status Colors
    [PROJECT_STATUS.PLANNING]: '#faad14', // Warning yellow
    [PROJECT_STATUS.PRE_LAUNCH]: '#1890ff', // Primary blue
    [PROJECT_STATUS.LAUNCHED]: '#52c41a', // Success green
    [PROJECT_STATUS.UNDER_CONSTRUCTION]: '#722ed1', // Purple
    [PROJECT_STATUS.READY_TO_MOVE]: '#13c2c2', // Cyan
    [PROJECT_STATUS.COMPLETED]: '#52c41a', // Success green
    [PROJECT_STATUS.ON_HOLD]: '#ff4d4f', // Error red
  
    // Unit Status Colors
    [UNIT_STATUS.AVAILABLE]: '#52c41a', // Success green
    [UNIT_STATUS.BOOKED]: '#faad14', // Warning yellow
    [UNIT_STATUS.SOLD]: '#1890ff', // Primary blue
    [UNIT_STATUS.BLOCKED]: '#ff4d4f', // Error red
    [UNIT_STATUS.HOLD]: '#722ed1', // Purple
  
    // Lead Status Colors
    [LEAD_STATUS.NEW]: '#1890ff', // Primary blue
    [LEAD_STATUS.CONTACTED]: '#722ed1', // Purple
    [LEAD_STATUS.QUALIFIED]: '#52c41a', // Success green
    [LEAD_STATUS.SITE_VISIT_SCHEDULED]: '#faad14', // Warning yellow
    [LEAD_STATUS.SITE_VISIT_COMPLETED]: '#13c2c2', // Cyan
    [LEAD_STATUS.NEGOTIATION]: '#fa8c16', // Orange
    [LEAD_STATUS.PROPOSAL_SENT]: '#eb2f96', // Magenta
    [LEAD_STATUS.FOLLOW_UP]: '#722ed1', // Purple
    [LEAD_STATUS.BOOKED]: '#52c41a', // Success green
    [LEAD_STATUS.NOT_INTERESTED]: '#ff4d4f', // Error red
    [LEAD_STATUS.LOST]: '#8c8c8c', // Gray
  
    // Payment Status Colors
    [PAYMENT_STATUS.PENDING]: '#faad14', // Warning yellow
    [PAYMENT_STATUS.DUE]: '#fa8c16', // Orange
    [PAYMENT_STATUS.PAID]: '#52c41a', // Success green
    [PAYMENT_STATUS.OVERDUE]: '#ff4d4f', // Error red
    [PAYMENT_STATUS.PARTIAL]: '#722ed1', // Purple
    [PAYMENT_STATUS.WAIVED]: '#8c8c8c', // Gray
  
    // Milestone Status Colors
    [MILESTONE_STATUS.NOT_STARTED]: '#8c8c8c', // Gray
    [MILESTONE_STATUS.IN_PROGRESS]: '#1890ff', // Primary blue
    [MILESTONE_STATUS.COMPLETED]: '#52c41a', // Success green
    [MILESTONE_STATUS.DELAYED]: '#ff4d4f', // Error red
    [MILESTONE_STATUS.ON_HOLD]: '#faad14', // Warning yellow
  }
  
  // =============================================================================
  // UTILITY CONSTANTS
  // =============================================================================
  
  export const CURRENCY_SYMBOL = '₹'
  export const CURRENCY_FORMAT = 'INR'
  
  export const PHONE_REGEX = /^[6-9]\d{9}$/
  export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  export const AADHAR_REGEX = /^\d{12}$/
  
  export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  export const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]
  
  // =============================================================================
  // API ENDPOINTS
  // =============================================================================
  
  export const API_ENDPOINTS = {
    AUTH: '/auth',
    USERS: '/users',
    PROJECTS: '/projects',
    TOWERS: '/towers',
    UNITS: '/units',
    LEADS: '/leads',
    SALES: '/sales',
    PAYMENTS: '/payments',
    ANALYTICS: '/analytics',
    CONSTRUCTION: '/construction',
    PRICING: '/pricing',
    AI: '/ai',
  }
  
  export default {
    USER_ROLES,
    ROLE_CATEGORIES,
    PROJECT_TYPES,
    PROJECT_STATUS,
    UNIT_TYPES,
    UNIT_STATUS,
    UNIT_FACING,
    LEAD_STATUS,
    LEAD_SOURCES,
    LEAD_PRIORITY,
    QUALIFICATION_STATUS,
    INTERACTION_TYPES,
    INTERACTION_OUTCOMES,
    PAYMENT_STATUS,
    PAYMENT_METHODS,
    TRANSACTION_STATUS,
    MILESTONE_STATUS,
    MILESTONE_CATEGORIES,
    CONSTRUCTION_PHASES,
    AMENITY_CATEGORIES,
    COMMON_AMENITIES,
    DASHBOARD_WIDGETS,
    CHART_TYPES,
    DATE_RANGES,
    THEMES,
    PAGE_SIZES,
    SORT_ORDERS,
    STATUS_COLORS,
    CURRENCY_SYMBOL,
    CURRENCY_FORMAT,
    PHONE_REGEX,
    EMAIL_REGEX,
    PAN_REGEX,
    AADHAR_REGEX,
    MAX_FILE_SIZE,
    ALLOWED_FILE_TYPES,
    API_ENDPOINTS,
  }
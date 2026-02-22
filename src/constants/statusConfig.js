// Centralized status → color/icon config for the entire platform.
// Import { STATUS_CONFIG } from 'constants/statusConfig' and use
// STATUS_CONFIG.lead[status] to get { label, color, icon }.

import {
  FiberNew,
  Phone,
  ThumbUp,
  LocationOn,
  Handshake,
  CheckCircle,
  Cancel,
  Block,
  Schedule,
  Sell,
  Lock,
  Home,
  Construction,
  PlayArrow,
  Pause,
  DoneAll,
  Receipt,
  Send,
  Paid,
  Warning,
  HourglassEmpty,
  Description,
  EventAvailable,
  Assignment,
  RateReview,
  PauseCircle,
} from '@mui/icons-material';

// Lead statuses
export const LEAD_STATUS = {
  'New':                  { label: 'New',                  color: 'info',    icon: FiberNew },
  'Contacted':            { label: 'Contacted',            color: 'warning', icon: Phone },
  'Qualified':            { label: 'Qualified',            color: 'primary', icon: ThumbUp },
  'Site Visit Scheduled': { label: 'Site Visit Scheduled', color: 'info',    icon: Schedule },
  'Site Visit Completed': { label: 'Site Visit Completed', color: 'primary', icon: LocationOn },
  'Negotiating':          { label: 'Negotiating',          color: 'warning', icon: Handshake },
  'Booked':               { label: 'Booked',               color: 'success', icon: CheckCircle },
  'Lost':                 { label: 'Lost',                 color: 'error',   icon: Cancel },
  'Unqualified':          { label: 'Unqualified',          color: 'default', icon: Block },
};

// Unit statuses
export const UNIT_STATUS = {
  available: { label: 'Available', color: 'success', icon: Home },
  booked:    { label: 'Booked',    color: 'primary', icon: Sell },
  sold:      { label: 'Sold',      color: 'info',    icon: CheckCircle },
  blocked:   { label: 'Blocked',   color: 'error',   icon: Lock },
};

// Project statuses (backend uses hyphens)
export const PROJECT_STATUS = {
  'planning':            { label: 'Planning',            color: 'default', icon: Description },
  'pre-launch':          { label: 'Pre-Launch',          color: 'info',    icon: Schedule },
  'launched':            { label: 'Launched',            color: 'primary', icon: PlayArrow },
  'under-construction':  { label: 'Under Construction',  color: 'warning', icon: Construction },
  'completed':           { label: 'Completed',           color: 'success', icon: DoneAll },
  'on-hold':             { label: 'On Hold',             color: 'error',   icon: Pause },
};

// Tower statuses (backend uses underscores)
export const TOWER_STATUS = {
  'planning':            { label: 'Planning',            color: 'default', icon: Description },
  'under_construction':  { label: 'Under Construction',  color: 'warning', icon: Construction },
  'completed':           { label: 'Completed',           color: 'success', icon: DoneAll },
  'on_hold':             { label: 'On Hold',             color: 'error',   icon: Pause },
  'cancelled':           { label: 'Cancelled',           color: 'error',   icon: Cancel },
};

// Sale statuses
export const SALE_STATUS = {
  'Pending Approval': { label: 'Pending Approval', color: 'warning', icon: HourglassEmpty },
  'Booked':           { label: 'Booked',           color: 'primary', icon: Sell },
  'Agreement Signed': { label: 'Agreement Signed', color: 'info',    icon: Description },
  'Registered':       { label: 'Registered',       color: 'success', icon: EventAvailable },
  'Completed':        { label: 'Completed',        color: 'success', icon: CheckCircle },
  'Cancelled':        { label: 'Cancelled',        color: 'error',   icon: Cancel },
};

// Payment / Invoice statuses
export const PAYMENT_STATUS = {
  pending:        { label: 'Pending',        color: 'warning', icon: HourglassEmpty },
  paid:           { label: 'Paid',           color: 'success', icon: Paid },
  overdue:        { label: 'Overdue',        color: 'error',   icon: Warning },
  partially_paid: { label: 'Partial',        color: 'info',    icon: Receipt },
  draft:          { label: 'Draft',          color: 'default', icon: Description },
  generated:      { label: 'Generated',      color: 'primary', icon: Receipt },
  sent:           { label: 'Sent',           color: 'info',    icon: Send },
  cancelled:      { label: 'Cancelled',      color: 'error',   icon: Cancel },
};

// Task statuses
export const TASK_STATUS = {
  'Open':         { label: 'Open',         color: 'info',      icon: Assignment },
  'In Progress':  { label: 'In Progress',  color: 'warning',   icon: PlayArrow },
  'Under Review': { label: 'Under Review', color: 'secondary', icon: RateReview },
  'Completed':    { label: 'Completed',    color: 'success',   icon: CheckCircle },
  'On Hold':      { label: 'On Hold',      color: 'default',   icon: PauseCircle },
  'Cancelled':    { label: 'Cancelled',    color: 'error',     icon: Cancel },
};

// Task priorities
export const TASK_PRIORITY = {
  'Critical': { label: 'Critical', color: 'error',   icon: Warning },
  'High':     { label: 'High',     color: 'warning', icon: Warning },
  'Medium':   { label: 'Medium',   color: 'info',    icon: null },
  'Low':      { label: 'Low',      color: 'success', icon: null },
};

// Approval request statuses
export const APPROVAL_STATUS = {
  pending:   { label: 'Pending',   color: 'warning', icon: HourglassEmpty },
  approved:  { label: 'Approved',  color: 'success', icon: CheckCircle },
  rejected:  { label: 'Rejected',  color: 'error',   icon: Cancel },
  cancelled: { label: 'Cancelled', color: 'default', icon: Block },
  expired:   { label: 'Expired',   color: 'default', icon: Schedule },
};

// Convenience lookup: getStatusConfig('lead', 'New') → { label, color, icon }
export const getStatusConfig = (type, status) => {
  const map = {
    lead: LEAD_STATUS,
    unit: UNIT_STATUS,
    project: PROJECT_STATUS,
    tower: TOWER_STATUS,
    sale: SALE_STATUS,
    payment: PAYMENT_STATUS,
    task: TASK_STATUS,
    approval: APPROVAL_STATUS,
  };
  return map[type]?.[status] || { label: status || '-', color: 'default', icon: null };
};

// Chart colors - single source of truth
export const CHART_COLORS = [
  '#1e88e5', '#43a047', '#fb8c00', '#8e24aa',
  '#00acc1', '#e53935', '#ffb300', '#546e7a',
];

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

// Project statuses
export const PROJECT_STATUS = {
  'planning':            { label: 'Planning',            color: 'default', icon: Description },
  'pre-launch':          { label: 'Pre-Launch',          color: 'info',    icon: Schedule },
  'launched':            { label: 'Launched',            color: 'primary', icon: PlayArrow },
  'under-construction':  { label: 'Under Construction',  color: 'warning', icon: Construction },
  'completed':           { label: 'Completed',           color: 'success', icon: DoneAll },
  'on-hold':             { label: 'On Hold',             color: 'error',   icon: Pause },
};

// Sale statuses
export const SALE_STATUS = {
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

// Convenience lookup: getStatusConfig('lead', 'New') → { label, color, icon }
export const getStatusConfig = (type, status) => {
  const map = {
    lead: LEAD_STATUS,
    unit: UNIT_STATUS,
    project: PROJECT_STATUS,
    sale: SALE_STATUS,
    payment: PAYMENT_STATUS,
  };
  return map[type]?.[status] || { label: status || '-', color: 'default', icon: null };
};

// Chart colors - single source of truth
export const CHART_COLORS = [
  '#1e88e5', '#43a047', '#fb8c00', '#8e24aa',
  '#00acc1', '#e53935', '#ffb300', '#546e7a',
];

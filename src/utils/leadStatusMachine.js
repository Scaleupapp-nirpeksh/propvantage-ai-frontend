// File: src/utils/leadStatusMachine.js
// Frontend mirror of backend utils/leadStatusMachine.js — drives the quick
// status-change menu so users only see valid next transitions. The internal
// terminal value stays 'Booked'; the UI labels it "Booking".

export const LEAD_STATUSES = ['New', 'Qualified', 'Site Visit Completed', 'Negotiating', 'Booked', 'Lost', 'Revived'];

export const LEAD_STATUS_TRANSITIONS = {
  New: ['Qualified', 'Lost'],
  Qualified: ['Site Visit Completed', 'Lost'],
  'Site Visit Completed': ['Negotiating', 'Booked', 'Lost'],
  Negotiating: ['Booked', 'Lost'],
  Booked: ['Lost'],
  Lost: ['Revived'],
  Revived: ['Site Visit Completed', 'Negotiating'],
};

export function allowedNextStatuses(from) {
  return LEAD_STATUS_TRANSITIONS[from] || [];
}

export function statusLabel(status) {
  return status === 'Booked' ? 'Booking' : status;
}

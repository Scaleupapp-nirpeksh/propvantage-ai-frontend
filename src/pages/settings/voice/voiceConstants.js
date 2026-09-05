// File: src/pages/settings/voice/voiceConstants.js
// Description: Labels shared by the playbook editor, list, and the lead-page picker.

export const TOOL_LABELS = {
  get_available_units: 'Check live availability & prices',
  update_lead_qualification: 'Save what it learns about the requirement',
  schedule_site_visit: 'Book a site visit',
  set_follow_up: 'Set a follow-up date',
  request_human_callback: 'Arrange a callback from the executive',
  mark_do_not_call: 'Mark do-not-call',
};

export const HANDOVER_LABELS = {
  asks_for_human: 'Caller asks for a person',
  price_or_discount: 'Price negotiation or discount request',
  payment_dispute: 'Disputes an amount or due date',
  legal_or_loan: 'Legal, registration or loan questions',
  complaint: 'Raises a complaint',
  hot_buyer: 'Clearly ready to buy',
};

export const LEAD_STATUSES = ['New', 'Qualified', 'Site Visit Completed', 'Negotiating', 'Booked', 'Lost', 'Revived'];

export const NOTIFY_ROLES = ['Business Head', 'Sales Head', 'Marketing Head', 'Finance Head', 'Legal Head', 'CRM Head', 'Project Director', 'Sales Manager', 'Finance Manager'];

export const TRIGGER_PARAM_FIELDS = {
  'lead.followUpMissed': [{ key: 'hoursAfter', label: 'Hours after the missed follow-up', default: 24 }],
  'lead.siteVisitReminder': [{ key: 'hoursBefore', label: 'Hours before the visit', default: 20 }],
  'installment.due': [{ key: 'daysBefore', label: 'Days before the due date', default: 3 }],
};

export const VARIABLE_HINTS = [
  '{{leadFirstName}}', '{{projectName}}', '{{execName}}', '{{agentName}}',
  '{{installmentAmount}}', '{{installmentDue}}', '{{installmentLabel}}', '{{visitWhen}}', '{{followUpWas}}',
];

export const JOB_STATUS_COLOR = {
  scheduled: 'info', calling: 'primary', completed: 'success', no_answer: 'warning', failed: 'error', cancelled: 'default', skipped: 'default',
};

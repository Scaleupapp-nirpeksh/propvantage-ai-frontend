import {
  PersonAdd, Autorenew, CheckCircle, ChatBubble, AlternateEmail,
  CalendarToday, Warning, Schedule, TrendingUp, SmartToy,
  CurrencyRupee, Phone, Engineering, Handshake,
} from '@mui/icons-material';

// Notification type → icon, label, color mapping
export const NOTIFICATION_TYPES = {
  task_assigned:       { label: 'Task Assigned',       icon: PersonAdd,      color: '#1e88e5' },
  task_status_changed: { label: 'Status Changed',      icon: Autorenew,      color: '#78909c' },
  task_completed:      { label: 'Task Completed',      icon: CheckCircle,    color: '#43a047' },
  task_comment:        { label: 'Comment',             icon: ChatBubble,     color: '#1e88e5' },
  task_mention:        { label: 'Mentioned',           icon: AlternateEmail, color: '#8e24aa' },
  task_due_today:      { label: 'Due Today',           icon: CalendarToday,  color: '#fb8c00' },
  task_overdue:        { label: 'Overdue',             icon: Warning,        color: '#e53935' },
  task_due_soon:       { label: 'Due Soon',            icon: Schedule,       color: '#fdd835' },
  task_escalated:      { label: 'Escalated',           icon: TrendingUp,     color: '#e53935' },
  task_auto_generated: { label: 'Auto-Generated',      icon: SmartToy,      color: '#00acc1' },
  payment_overdue:     { label: 'Payment Overdue',     icon: CurrencyRupee,  color: '#e53935' },
  lead_follow_up_due:  { label: 'Follow-up Due',       icon: Phone,          color: '#fb8c00' },
  milestone_delayed:   { label: 'Milestone Delayed',   icon: Engineering,    color: '#fb8c00' },
  sale_booked:         { label: 'Sale Booked',         icon: Handshake,      color: '#43a047' },
};

// Priority → color mapping for dots/badges
export const NOTIFICATION_PRIORITY = {
  urgent: { color: '#e53935', muiColor: 'error' },
  high:   { color: '#fb8c00', muiColor: 'warning' },
  medium: { color: '#1e88e5', muiColor: 'info' },
  low:    { color: '#78909c', muiColor: 'default' },
};

// Categories for grouping in preferences page
export const NOTIFICATION_CATEGORIES = [
  {
    label: 'Tasks',
    types: [
      { key: 'task_assigned',       label: 'Task assigned to me',     description: 'When someone assigns a task to you' },
      { key: 'task_status_changed', label: 'Task status changed',     description: 'When a task you watch changes status' },
      { key: 'task_completed',      label: 'Task completed',          description: 'When a task you created or assigned is completed' },
      { key: 'task_comment',        label: 'Comment on my task',      description: 'When someone comments on your task' },
      { key: 'task_mention',        label: '@mentioned in comment',   description: 'When someone mentions you in a comment' },
      { key: 'task_due_today',      label: 'Tasks due today (daily)', description: 'Daily digest of tasks due today' },
      { key: 'task_overdue',        label: 'Overdue tasks (daily)',   description: 'Daily digest of overdue tasks' },
      { key: 'task_due_soon',       label: 'Task due within 24h',     description: 'When a task is due within 24 hours' },
      { key: 'task_escalated',      label: 'Task escalated to me',    description: 'When an overdue task is escalated to you' },
      { key: 'task_auto_generated', label: 'Auto-generated task',     description: 'When the system creates a task for you' },
    ],
  },
  {
    label: 'Business',
    types: [
      { key: 'payment_overdue',     label: 'Payment overdue',      description: 'When an installment payment is overdue' },
      { key: 'lead_follow_up_due',  label: 'Lead follow-up due',   description: 'When a lead follow-up date is today' },
      { key: 'milestone_delayed',   label: 'Milestone delayed',    description: 'When a construction milestone is past planned end' },
      { key: 'sale_booked',         label: 'Sale booked',          description: 'When a new sale is booked' },
    ],
  },
];

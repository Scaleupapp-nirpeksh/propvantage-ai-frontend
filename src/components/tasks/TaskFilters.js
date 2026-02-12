import React from 'react';
import { FilterBar } from '../common';
import { TASK_CATEGORIES, TASK_PRIORITIES } from '../../constants/taskConfig';

const STATUS_OPTIONS = [
  { value: 'Open', label: 'Open' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Under Review', label: 'Under Review' },
  { value: 'Completed', label: 'Completed' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = TASK_PRIORITIES.map((p) => ({ value: p, label: p }));
const CATEGORY_OPTIONS = TASK_CATEGORIES.map((c) => ({ value: c, label: c }));

const TaskFilters = ({
  values = {}, onChange, onClear,
  showTeamFilters = false, teamMembers = [],
  showAdvanced = false,
  extraActions,
}) => {
  const filters = [
    { key: 'search', type: 'search', label: 'Tasks', placeholder: 'Search tasks...' },
    { key: 'status', type: 'select', label: 'Status', options: STATUS_OPTIONS },
    { key: 'priority', type: 'select', label: 'Priority', options: PRIORITY_OPTIONS },
    { key: 'category', type: 'select', label: 'Category', options: CATEGORY_OPTIONS },
  ];

  // Overdue toggle
  if (showAdvanced) {
    filters.push({
      key: 'isOverdue',
      type: 'select',
      label: 'Overdue',
      options: [
        { value: 'true', label: 'Overdue only' },
        { value: 'false', label: 'Not overdue' },
      ],
    });
  }

  if (showTeamFilters && teamMembers.length > 0) {
    filters.push({
      key: 'assignedTo',
      type: 'select',
      label: 'Assigned To',
      options: teamMembers.map((m) => ({
        value: m._id || m.id,
        label: `${m.firstName || ''} ${m.lastName || ''}`.trim(),
      })),
    });
  }

  // Date range filters
  if (showAdvanced) {
    filters.push(
      { key: 'dueBefore', type: 'date', label: 'Due Before' },
      { key: 'dueAfter', type: 'date', label: 'Due After' },
    );
  }

  // Tags filter
  if (showAdvanced) {
    filters.push({
      key: 'tags',
      type: 'search',
      label: 'Tags',
      placeholder: 'e.g. follow-up,urgent',
    });
  }

  return (
    <FilterBar
      filters={filters}
      values={values}
      onChange={onChange}
      onClear={onClear}
      extraActions={extraActions}
    />
  );
};

export default TaskFilters;

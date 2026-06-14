// Regression test for the reports templates table columns.
// Guards the blank-page crash: DataTable calls render(value, row), so columns must
// read off `row` (2nd arg). A template with no `schedule`/`delivery` must not throw.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import DataTable from '../../components/common/DataTable';
import { buildColumns } from './ReportTemplateListPage';

const rows = [
  {
    _id: '1', name: 'Weekly board report', blocks: [{}, {}, {}], status: 'active',
    schedule: { enabled: true, frequency: 'weekly', dayOfWeek: 1, time: '09:00', timezone: 'Asia/Kolkata', nextRunAt: '2026-06-15T03:30:00.000Z' },
    delivery: { recipients: [{ email: 'a@b.com', name: 'Asha' }, { email: 'c@d.com' }] },
    updatedAt: '2026-06-14T00:00:00.000Z',
  },
  // The crash case: a manual template with NO schedule and NO delivery.
  { _id: '2', name: 'Manual template', blocks: [], status: 'active' },
  {
    _id: '3', name: 'Monthly', status: 'paused',
    schedule: { enabled: true, frequency: 'monthly', dayOfMonth: 1, time: '08:00' },
    delivery: { recipients: [] },
  },
];

const renderTable = () =>
  render(
    <ThemeProvider theme={theme}>
      <DataTable columns={buildColumns()} rows={rows} rowKey="_id" />
    </ThemeProvider>
  );

describe('ReportTemplateListPage columns', () => {
  it('renders scheduled + manual templates without crashing', () => {
    expect(() => renderTable()).not.toThrow();
    expect(screen.getByText('Weekly board report')).toBeInTheDocument();
    expect(screen.getByText('Manual template')).toBeInTheDocument();
  });

  it('shows plain-English cadence and a Manual fallback', () => {
    renderTable();
    expect(screen.getByText(/Weekly · Mon 09:00/)).toBeInTheDocument();
    expect(screen.getByText(/Monthly · day 1/)).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument(); // template #2 (no schedule)
  });

  it('summarises recipients', () => {
    renderTable();
    expect(screen.getByText('2 recipients')).toBeInTheDocument();
  });
});

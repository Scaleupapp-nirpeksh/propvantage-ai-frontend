import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ReflectionHistory from '../ReflectionHistory';

const theme = createTheme();
const Wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

const SAMPLE_REFLECTIONS = [
  {
    _id: 'r1',
    isoWeek: '2026-W24',
    weekStart: '2026-06-08',
    weekEnd: '2026-06-14',
    status: 'submitted',
    submittedAt: '2026-06-14T10:00:00Z',
    answers: { wins: 'Closed 2 deals', areasToImprove: 'Follow-up speed' },
    managerAck: {},
  },
  {
    _id: 'r2',
    isoWeek: '2026-W23',
    weekStart: '2026-06-01',
    weekEnd: '2026-06-07',
    status: 'submitted',
    submittedAt: '2026-06-07T09:00:00Z',
    answers: { wins: 'Hit quota', plansNextWeek: 'Push pipeline' },
    managerAck: { by: 'mgr1', note: 'Great work!' },
  },
];

describe('ReflectionHistory', () => {
  it('renders empty-state when no reflections are passed', () => {
    render(<Wrapper><ReflectionHistory reflections={[]} /></Wrapper>);
    expect(screen.getByText('No past reflections.')).toBeInTheDocument();
  });

  it('renders a non-empty list of reflections with week labels and status chips', () => {
    render(<Wrapper><ReflectionHistory reflections={SAMPLE_REFLECTIONS} /></Wrapper>);

    // Empty-state should NOT appear
    expect(screen.queryByText('No past reflections.')).not.toBeInTheDocument();

    // Both week labels are present
    expect(screen.getByText('Week 2026-W24')).toBeInTheDocument();
    expect(screen.getByText('Week 2026-W23')).toBeInTheDocument();

    // Status chips
    const statusChips = screen.getAllByText('submitted');
    expect(statusChips).toHaveLength(2);
  });

  it('renders manager ack chip when managerAck.by is set', () => {
    render(<Wrapper><ReflectionHistory reflections={SAMPLE_REFLECTIONS} /></Wrapper>);
    expect(screen.getByText('Acked')).toBeInTheDocument();
  });

  it('uses isoWeek as key fallback when _id is absent', () => {
    const withoutId = [{ isoWeek: '2026-W22', status: 'draft', answers: {}, managerAck: {} }];
    render(<Wrapper><ReflectionHistory reflections={withoutId} /></Wrapper>);
    expect(screen.getByText('Week 2026-W22')).toBeInTheDocument();
  });
});

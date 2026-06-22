// src/pages/people/OrgPerformancePage.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { peopleAPI } from '../../services/api';
import OrgPerformancePage from './OrgPerformancePage';

jest.mock('../../services/api', () => ({
  peopleAPI: {
    org:       jest.fn(),
    moraleOrg: jest.fn(),
  },
}));

jest.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: jest.fn() }),
}));

const theme = createTheme();
const Wrapper = ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>;

const NEW_SHAPE_RESPONSE = {
  data: {
    data: {
      heads: [
        {
          user: {
            _id:          'u1',
            firstName:    'Priya',
            lastName:     'Sharma',
            email:        'priya@example.com',
            role:         'Sales Head',
            lastActiveAt: new Date().toISOString(),
          },
          metrics: {
            leadsWorked:          40,
            leadsConverted:       12,
            conversionRate:       30,
            salesCount:           12,
            salesValue:           4500000,
            tasksCompleted:       55,
            tasksOverdue:         3,
            taskSlaRate:          85,
            ticketsResolved:      8,
            ticketAvgResolutionHrs: 6,
            interactionsLogged:   22,
          },
          attainment: {
            salesValue:        { actual: 4500000, target: 5000000, pct: 90 },
            leadsWorked:       { actual: 40, target: 50, pct: 80 },
            tasksCompleted:    { actual: 55, target: 60, pct: 91.7 },
            interactionsLogged:{ actual: 22, target: 20, pct: 110 },
          },
          teamSize: 8,
          teamRollup: {
            leadsWorked:       120,
            leadsConverted:    36,
            conversionRate:    30,
            salesCount:        36,
            salesValue:        13500000,
            tasksCompleted:    165,
            tasksOverdue:      9,
            taskSlaRate:       83,
            ticketsResolved:   24,
            ticketAvgResolutionHrs: 7,
            interactionsLogged: 66,
            teamSize:          8,
          },
        },
      ],
      orgRollup: {
        leadsWorked:       120,
        leadsConverted:    36,
        conversionRate:    30,
        salesCount:        36,
        salesValue:        13500000,
        tasksCompleted:    165,
        tasksOverdue:      9,
        taskSlaRate:       83,
        ticketsResolved:   24,
        ticketAvgResolutionHrs: 7,
        interactionsLogged: 66,
      },
    },
  },
};

describe('OrgPerformancePage', () => {
  beforeEach(() => {
    peopleAPI.org.mockResolvedValue(NEW_SHAPE_RESPONSE);
    peopleAPI.moraleOrg.mockRejectedValue(new Error('no morale'));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders head name after data loads', async () => {
    render(<Wrapper><OrgPerformancePage /></Wrapper>);
    expect(await screen.findByText('Priya Sharma')).toBeInTheDocument();
  });

  it('renders teamSize for the head', async () => {
    render(<Wrapper><OrgPerformancePage /></Wrapper>);
    await screen.findByText('Priya Sharma');
    expect(screen.getByTestId('team-size')).toHaveTextContent('8');
  });

  it('renders a team rollup sales value without NaN', async () => {
    render(<Wrapper><OrgPerformancePage /></Wrapper>);
    await screen.findByText('Priya Sharma');
    // 13500000 → ₹1.35 Cr (formatted by MetricTile) — appears in both org rollup and team rollup
    expect(screen.queryByText(/NaN/)).toBeNull();
    const crElements = screen.getAllByText(/₹1\.35 Cr/);
    expect(crElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the org rollup section', async () => {
    render(<Wrapper><OrgPerformancePage /></Wrapper>);
    await screen.findByText('Priya Sharma');
    expect(screen.getByText('Organization')).toBeInTheDocument();
  });

  it('shows "No department heads found" when heads array is empty', async () => {
    peopleAPI.org.mockResolvedValue({
      data: { data: { heads: [], orgRollup: {} } },
    });
    render(<Wrapper><OrgPerformancePage /></Wrapper>);
    expect(await screen.findByText(/No department heads found/)).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Scorecard from '../Scorecard';

const theme = createTheme();
const Wrapper = ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>;

const mockUser = { firstName: 'Jane', lastName: 'Doe', role: 'Sales Executive' };
const mockMetrics = { salesValue: 2000000, salesCount: 3, leadsWorked: 10, conversionRate: 30, taskSlaRate: 80, interactionsLogged: 15 };

describe('Scorecard', () => {
  it('renders user name', () => {
    render(<Wrapper><Scorecard user={mockUser} metrics={mockMetrics} /></Wrapper>);
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('renders no NaN in metric tiles', () => {
    render(<Wrapper><Scorecard user={mockUser} metrics={mockMetrics} /></Wrapper>);
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it('shows flag chip when flags present', () => {
    const flags = { staleLeads: [1, 2], overdueFollowUps: [3] };
    render(<Wrapper><Scorecard user={mockUser} metrics={mockMetrics} flags={flags} /></Wrapper>);
    expect(screen.getByText(/flags/i)).toBeInTheDocument();
  });
});

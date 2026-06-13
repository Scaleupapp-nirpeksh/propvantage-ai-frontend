// File: src/components/reports/ReportBlockRenderer.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import ReportBlockRenderer from './ReportBlockRenderer';

const renderWithTheme = (ui) => render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('ReportBlockRenderer', () => {
  it('renders a text note block', () => {
    renderWithTheme(
      <ReportBlockRenderer block={{ type: 'text.note', kind: 'layout', data: { text: 'Hello board' } }} />
    );
    expect(screen.getByText('Hello board')).toBeInTheDocument();
  });

  it('renders an error state when the block failed to resolve', () => {
    renderWithTheme(
      <ReportBlockRenderer block={{ type: 'kpi.revenue', kind: 'kpi', title: 'Revenue', data: { error: 'boom' } }} />
    );
    expect(screen.getByText(/couldn.t load/i)).toBeInTheDocument();
  });

  it('renders a KPI title', () => {
    renderWithTheme(
      <ReportBlockRenderer block={{ type: 'kpi.revenue', kind: 'kpi', title: 'Total Revenue', data: { value: 1000, unit: 'currency' } }} />
    );
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
  });
});

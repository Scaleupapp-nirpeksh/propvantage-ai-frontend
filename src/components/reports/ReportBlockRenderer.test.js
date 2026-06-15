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

  it('renders an AI narrative block', () => {
    renderWithTheme(
      <ReportBlockRenderer block={{ type: 'ai.narrative', kind: 'narrative', title: 'Summary', data: { text: 'Revenue is up 12%.' } }} />
    );
    expect(screen.getByText('Revenue is up 12%.')).toBeInTheDocument();
  });
  it('renders a friendly fallback when the narrative is empty', () => {
    renderWithTheme(
      <ReportBlockRenderer block={{ type: 'ai.narrative', kind: 'narrative', data: { text: '', error: 'AI not configured' } }} />
    );
    expect(screen.getByText(/narrative is unavailable/i)).toBeInTheDocument();
  });

  it('formats table cells by per-column unit (currency / percent / count) and shows labels', () => {
    renderWithTheme(
      <ReportBlockRenderer block={{
        type: 'table.projectComparison', kind: 'table', title: 'Comparison',
        data: {
          columns: [
            { key: 'project', label: 'Project', unit: 'text' },
            { key: 'sales', label: 'Sales', unit: 'currency' },
            { key: 'conversion', label: 'Conversion', unit: 'percent' },
            { key: 'openTasks', label: 'Open', unit: 'count' },
          ],
          rows: [{ project: 'Skyline', sales: 42000000, conversion: 0.23, openTasks: 12 }],
        },
      }} />
    );
    expect(screen.getByText('Project')).toBeInTheDocument();   // header label, not the raw key
    expect(screen.getByText('Skyline')).toBeInTheDocument();   // text cell raw
    expect(screen.getByText('₹4.20 Cr')).toBeInTheDocument();  // currency formatted
    expect(screen.getByText('23.0%')).toBeInTheDocument();     // percent formatted from a fraction
  });

  it('falls back to raw keys when a table has no column metadata', () => {
    renderWithTheme(
      <ReportBlockRenderer block={{ type: 'table.legacy', kind: 'table', data: { rows: [{ status: 'paid', count: 8 }] } }} />
    );
    expect(screen.getByText('status')).toBeInTheDocument();    // raw key as header
    expect(screen.getByText('paid')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('applies an accentColor override to the AI narrative accent', () => {
    const { container } = renderWithTheme(
      <ReportBlockRenderer block={{ type: 'ai.narrative', kind: 'narrative', title: 'S', data: { text: 'Hi' } }} themePreset="clean" accentColor="#e91e63" />
    );
    // the narrative left-accent bar uses the override
    expect(container.innerHTML).toMatch(/#e91e63/i);
  });
});

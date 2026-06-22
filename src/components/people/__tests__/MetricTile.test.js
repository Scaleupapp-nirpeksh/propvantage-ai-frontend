import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MetricTile from '../MetricTile';

const theme = createTheme();
const Wrapper = ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>;

describe('MetricTile', () => {
  it('formats a raw number as currency without NaN', () => {
    render(<Wrapper><MetricTile label="Sales Value" value={50000000} unit="currency" /></Wrapper>);
    expect(screen.getByText(/₹5\.00 Cr/)).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it('handles comma-string value without NaN', () => {
    render(<Wrapper><MetricTile label="Sales Value" value="50,000,000" unit="currency" /></Wrapper>);
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it('handles pre-formatted ₹ string without NaN', () => {
    render(<Wrapper><MetricTile label="Sales Value" value="₹5 Cr" unit="currency" /></Wrapper>);
    expect(screen.getByText(/₹5 Cr/)).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it('renders percent value', () => {
    render(<Wrapper><MetricTile label="SLA Rate" value={92} unit="percent" /></Wrapper>);
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('renders — for null value', () => {
    render(<Wrapper><MetricTile label="Metric" value={null} unit="number" /></Wrapper>);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

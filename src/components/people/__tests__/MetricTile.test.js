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

  it('renders percent value — fraction 0-1 multiplied by 100', () => {
    // Backend sends fractions (0-1); value=1 → "100%", value=0.92 → "92%"
    render(<Wrapper><MetricTile label="SLA Rate" value={1} unit="percent" /></Wrapper>);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders 0.33 fraction as 33%', () => {
    render(<Wrapper><MetricTile label="Conversion" value={0.33} unit="percent" /></Wrapper>);
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('renders — for null value', () => {
    render(<Wrapper><MetricTile label="Metric" value={null} unit="number" /></Wrapper>);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

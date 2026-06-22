import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import ReflectionEditor from '../ReflectionEditor';

// Mock peopleAPI — declare fns outside factory to assign implementations after hoisting
const mockGetReflection = jest.fn();
const mockSaveReflection = jest.fn();
const mockSubmitReflection = jest.fn();

jest.mock('../../../services/api', () => ({
  peopleAPI: {
    getReflection: (...args) => mockGetReflection(...args),
    saveReflection: (...args) => mockSaveReflection(...args),
    submitReflection: (...args) => mockSubmitReflection(...args),
  },
}));

const theme = createTheme();
const Wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    <SnackbarProvider>{children}</SnackbarProvider>
  </ThemeProvider>
);

describe('ReflectionEditor', () => {
  beforeEach(() => {
    mockGetReflection.mockResolvedValue({ data: { data: { status: 'draft', answers: {} } } });
    mockSaveReflection.mockResolvedValue({});
    mockSubmitReflection.mockResolvedValue({});
  });

  it('Submit button is disabled when fields are empty', async () => {
    render(<Wrapper><ReflectionEditor isoWeek="2026-W25" /></Wrapper>);
    // Wait for draft to load
    await waitFor(() => expect(screen.getByText('Submit')).toBeInTheDocument());
    const submitBtn = screen.getByText('Submit').closest('button');
    expect(submitBtn).toBeDisabled();
  });

  it('Submit button is disabled when fields have fewer than 500 chars', async () => {
    render(<Wrapper><ReflectionEditor isoWeek="2026-W25" /></Wrapper>);
    await waitFor(() => expect(screen.getByText('Submit')).toBeInTheDocument());

    const textareas = screen.getAllByRole('textbox');
    // Fill only first 4 required fields with 499 chars
    const shortText = 'a'.repeat(499);
    for (let i = 0; i < 4; i++) {
      fireEvent.change(textareas[i], { target: { value: shortText } });
    }
    const submitBtn = screen.getByText('Submit').closest('button');
    expect(submitBtn).toBeDisabled();
  });

  it('Submit button is enabled when all 5 fields meet 500 chars', async () => {
    render(<Wrapper><ReflectionEditor isoWeek="2026-W25" /></Wrapper>);
    await waitFor(() => expect(screen.getByText('Submit')).toBeInTheDocument());

    const textareas = screen.getAllByRole('textbox');
    const longText = 'a'.repeat(500);
    // Fill first 5 textareas (the 5 required prompts)
    for (let i = 0; i < 5; i++) {
      fireEvent.change(textareas[i], { target: { value: longText } });
    }
    await waitFor(() => {
      const submitBtn = screen.getByText('Submit').closest('button');
      expect(submitBtn).not.toBeDisabled();
    });
  });
});

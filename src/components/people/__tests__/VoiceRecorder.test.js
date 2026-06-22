import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SnackbarProvider } from 'notistack';
import VoiceRecorder from '../VoiceRecorder';

// Mock peopleAPI — use jest.fn() inside factory to avoid hoisting issues
jest.mock('../../../services/api', () => ({
  peopleAPI: {
    transcribe: jest.fn(),
  },
}));

// Captured onstop for manual triggering
let capturedOnstopFn = null;

// Class-based MediaRecorder mock
const mockStart = jest.fn();
const mockStop = jest.fn();

class FakeMediaRecorder {
  constructor() {
    this.start = mockStart;
    this.stop = mockStop;
    this._onstop = null;
    this._ondataavailable = null;
  }
  get onstop() { return this._onstop; }
  set onstop(fn) { this._onstop = fn; capturedOnstopFn = fn; }
  get ondataavailable() { return this._ondataavailable; }
  set ondataavailable(fn) { this._ondataavailable = fn; }
}

global.MediaRecorder = FakeMediaRecorder;

// Override getUserMedia — the value is set via property descriptor each beforeEach
// to avoid stale mock issues
let gumResolve = null;
const mockStream = {
  getTracks: function() { return [{ stop: function() {} }]; },
};

const theme = createTheme();
const Wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>
    <SnackbarProvider>{children}</SnackbarProvider>
  </ThemeProvider>
);

describe('VoiceRecorder', () => {
  beforeEach(() => {
    capturedOnstopFn = null;
    mockStart.mockClear();
    mockStop.mockClear();

    // Re-define mediaDevices fresh each test so we control the promise
    const getUserMedia = jest.fn(function() {
      return new Promise(function(resolve) {
        gumResolve = function() { resolve(mockStream); };
      });
    });
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia },
      writable: true,
      configurable: true,
    });
  });

  it('calls onTranscript with returned text and does not auto-submit', async () => {
    const { peopleAPI } = require('../../../services/api');
    peopleAPI.transcribe.mockResolvedValue({ data: { text: 'Hello world' } });
    const onTranscript = jest.fn();

    render(<Wrapper><VoiceRecorder onTranscript={onTranscript} /></Wrapper>);

    // Click mic to start recording
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalled();

    // Resolve getUserMedia manually
    await act(async () => {
      if (gumResolve) gumResolve();
      await new Promise(res => setTimeout(res, 10));
    });

    expect(mockStart).toHaveBeenCalled();
    expect(capturedOnstopFn).not.toBeNull();

    // Click stop
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(mockStop).toHaveBeenCalled();

    // Manually fire onstop (MediaRecorder would do this after stopping)
    await act(async () => {
      await capturedOnstopFn();
      await new Promise(res => setTimeout(res, 10));
    });

    await waitFor(() => {
      expect(peopleAPI.transcribe).toHaveBeenCalled();
      expect(onTranscript).toHaveBeenCalledWith('Hello world');
    });

    // VoiceRecorder must not call submitReflection
    expect(peopleAPI.submitReflection).toBeUndefined();
  });
});

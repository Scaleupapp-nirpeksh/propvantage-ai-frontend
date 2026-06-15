// src/pages/reports/useReportAgent.test.js
import { renderHook, act } from '@testing-library/react';
import { reportAgentAPI, reportAPI } from '../../services/api';
import useReportAgent from './useReportAgent';

jest.mock('../../services/api', () => ({
  reportAgentAPI: { message: jest.fn() },
  reportAPI: { preview: jest.fn() },
}));

describe('useReportAgent', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts empty', () => {
    const { result } = renderHook(() => useReportAgent());
    expect(result.current.messages).toEqual([]);
    expect(result.current.definition.blocks).toEqual([]);
    expect(result.current.previewBlocks).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('sends a message and applies the agent response', async () => {
    reportAgentAPI.message.mockResolvedValue({ data: { data: {
      sessionId: 's1', reply: 'Added revenue.',
      definition: { name: 'Q2', scope: { mode: 'portfolio' }, theme: { preset: 'clean' }, blocks: [{ id: 'b', type: 'kpi.revenue' }] },
      previewBlocks: [{ id: 'b', type: 'kpi.revenue', kind: 'kpi', data: { value: 100, unit: 'currency' } }],
    } } });
    const { result } = renderHook(() => useReportAgent());

    await act(async () => { await result.current.sendMessage('show revenue'); });

    expect(reportAgentAPI.message).toHaveBeenCalledWith(expect.objectContaining({ sessionId: null, message: 'show revenue' }));
    expect(result.current.messages).toEqual([
      { role: 'user', content: 'show revenue' },
      { role: 'assistant', content: 'Added revenue.' },
    ]);
    expect(result.current.sessionId).toBe('s1');
    expect(result.current.definition.name).toBe('Q2');
    expect(result.current.previewBlocks[0].data).toEqual({ value: 100, unit: 'currency' });
    expect(result.current.isLoading).toBe(false);
  });

  it('passes the sessionId on subsequent turns', async () => {
    reportAgentAPI.message.mockResolvedValue({ data: { data: { sessionId: 's1', reply: 'ok', definition: { blocks: [] }, previewBlocks: [] } } });
    const { result } = renderHook(() => useReportAgent());
    await act(async () => { await result.current.sendMessage('one'); });
    await act(async () => { await result.current.sendMessage('two'); });
    expect(reportAgentAPI.message).toHaveBeenLastCalledWith(expect.objectContaining({ sessionId: 's1', message: 'two' }));
  });

  it('surfaces an error turn without throwing', async () => {
    reportAgentAPI.message.mockRejectedValue({ response: { data: { message: 'boom' } } });
    const { result } = renderHook(() => useReportAgent());
    await act(async () => { await result.current.sendMessage('hi'); });
    expect(result.current.error).toBe('boom');
    expect(result.current.messages[1].role).toBe('assistant'); // a friendly error turn was appended
    expect(result.current.isLoading).toBe(false);
  });

  it('repreview re-resolves the canvas from the current definition', async () => {
    reportAPI.preview.mockResolvedValue({ data: { data: { blocks: [{ id: 'b', type: 'kpi.revenue', kind: 'kpi', data: { value: 5, unit: 'currency' } }] } } });
    const { result } = renderHook(() => useReportAgent());
    act(() => { result.current.setDefinition({ name: 'R', scope: { mode: 'portfolio' }, theme: { preset: 'clean' }, blocks: [{ id: 'b', type: 'kpi.revenue' }] }); });
    await act(async () => { await result.current.repreview(); });
    expect(reportAPI.preview).toHaveBeenCalled();
    expect(result.current.previewBlocks[0].data).toEqual({ value: 5, unit: 'currency' });
  });

  it('ignores blank input and re-entrancy while loading', async () => {
    let resolve;
    reportAgentAPI.message.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useReportAgent());
    act(() => { result.current.sendMessage('   '); }); // blank → ignored
    expect(reportAgentAPI.message).not.toHaveBeenCalled();
    act(() => { result.current.sendMessage('real'); });   // starts loading
    act(() => { result.current.sendMessage('again'); });  // ignored (loading)
    expect(reportAgentAPI.message).toHaveBeenCalledTimes(1);
    await act(async () => { resolve({ data: { data: { sessionId: 's', reply: 'k', definition: { blocks: [] }, previewBlocks: [] } } }); });
  });
});

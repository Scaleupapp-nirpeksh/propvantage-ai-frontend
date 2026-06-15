// File: src/pages/reports/useReportAgent.js
// Conversation state for the report agent. Sends each user turn to the backend agent
// and applies the returned { reply, definition, previewBlocks }. Mirrors useCopilotChat.
import { useState, useCallback } from 'react';
import { reportAgentAPI, reportAPI } from '../../services/api';

const EMPTY_DEFINITION = { name: '', scope: { mode: 'portfolio' }, theme: { preset: 'clean' }, blocks: [] };

const useReportAgent = (initialDefinition) => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);        // { role: 'user'|'assistant', content }
  const [definition, setDefinition] = useState(initialDefinition || EMPTY_DEFINITION);
  const [previewBlocks, setPreviewBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed || isLoading) return;
    setError(null);
    setMessages((m) => [...m, { role: 'user', content: trimmed }]);
    setIsLoading(true);
    try {
      const res = await reportAgentAPI.message({ sessionId, message: trimmed, definition });
      const data = res.data?.data || {};
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.definition) setDefinition(data.definition);
      if (Array.isArray(data.previewBlocks)) setPreviewBlocks(data.previewBlocks);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || '' }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry — I hit an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading, definition]);

  const repreview = useCallback(async () => {
    try {
      const res = await reportAPI.preview(definition);
      const blocks = res.data?.data?.blocks;
      if (Array.isArray(blocks)) setPreviewBlocks(blocks);
    } catch (_err) { /* leave the canvas as-is on a transient preview error */ }
  }, [definition]);

  return { sessionId, messages, definition, previewBlocks, isLoading, error, sendMessage, setDefinition, repreview };
};

export default useReportAgent;

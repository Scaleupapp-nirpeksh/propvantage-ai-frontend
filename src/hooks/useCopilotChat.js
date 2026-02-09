// File: src/hooks/useCopilotChat.js
// Description: Custom hook for AI Copilot chat state management
// Handles messages, conversation memory, loading, rate limiting, and error states

import { useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { copilotAPI } from '../services/api';

// Extract page context from current route pathname
// Parses projectId directly from URL since this hook runs outside Route param scope
const getPageContext = (pathname) => {
  const context = { currentPage: 'unknown' };

  if (pathname === '/dashboard' || pathname === '/') {
    context.currentPage = 'dashboard';
  } else if (pathname.startsWith('/projects')) {
    // Extract projectId from URL pattern: /projects/:projectId/...
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 2 && parts[0] === 'projects' && parts[1] !== 'create') {
      context.currentPage = 'project-detail';
      context.projectId = parts[1];
    } else {
      context.currentPage = 'projects-list';
    }
  } else if (pathname.startsWith('/leads')) {
    context.currentPage = 'leads-list';
  } else if (pathname.startsWith('/sales')) {
    context.currentPage = 'sales';
  } else if (pathname.startsWith('/payments')) {
    context.currentPage = 'payments';
  } else if (pathname.startsWith('/analytics')) {
    context.currentPage = 'analytics';
  } else if (pathname.startsWith('/commissions')) {
    context.currentPage = 'commissions';
  }

  return context;
};

const useCopilotChat = () => {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rateLimitedUntil, setRateLimitedUntil] = useState(null);
  const abortRef = useRef(null);

  const location = useLocation();

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    // Check rate limit
    if (rateLimitedUntil && Date.now() < rateLimitedUntil) return;

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    try {
      const context = getPageContext(location.pathname);

      const response = await copilotAPI.chat({
        message: text,
        conversationId,
        context,
      });

      const data = response.data;

      if (data.success) {
        const { conversationId: newConvId, response: copilotResponse } = data.data;
        setConversationId(newConvId);

        const aiMsg = {
          id: Date.now() + 1,
          role: 'assistant',
          content: copilotResponse.text,
          response: copilotResponse,
          intent: data.data.intent,
        };

        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      const status = err.response?.status;
      const errData = err.response?.data;

      // Handle rate limiting
      if (status === 429) {
        const retryAfter = errData?.retryAfter || 60;
        setRateLimitedUntil(Date.now() + retryAfter * 1000);

        const rateLimitMsg = {
          id: Date.now() + 1,
          role: 'system',
          content: errData?.code === 'AI_RATE_LIMITED'
            ? 'AI is busy, please try again shortly.'
            : `Rate limit reached. Please wait ${retryAfter} seconds.`,
        };
        setMessages(prev => [...prev, rateLimitMsg]);
      } else if (status === 401) {
        // Auth interceptor should handle redirect — show message
        setError('Session expired. Please login again.');
      } else if (status === 503) {
        const serviceMsg = {
          id: Date.now() + 1,
          role: 'system',
          content: 'AI is temporarily unavailable. Please try again in a moment.',
        };
        setMessages(prev => [...prev, serviceMsg]);
      } else {
        const genericMsg = {
          id: Date.now() + 1,
          role: 'system',
          content: errData?.message || 'Something went wrong. Please try again.',
        };
        setMessages(prev => [...prev, genericMsg]);
      }

      setError(errData?.message || err.message);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, isLoading, rateLimitedUntil, location.pathname]);

  const resetChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setRateLimitedUntil(null);
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const isRateLimited = rateLimitedUntil && Date.now() < rateLimitedUntil;

  return {
    messages,
    isLoading,
    error,
    isRateLimited,
    conversationId,
    sendMessage,
    resetChat,
  };
};

export default useCopilotChat;

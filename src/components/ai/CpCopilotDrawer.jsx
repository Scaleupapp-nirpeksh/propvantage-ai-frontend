// File: src/components/ai/CpCopilotDrawer.jsx
// Description: SP5 — CP-side AI Copilot floating chat. Mirrors the dev
//   CopilotFAB/CopilotChat pattern but talks to /api/cp/copilot/message
//   and renders citations from tool results.
//
//   Single component owns the FAB + drawer + conversation state.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Fab, Drawer, Box, Typography, IconButton, TextField, InputAdornment, Chip, Stack,
  Tooltip, CircularProgress, List, ListItemButton, ListItemText,
} from '@mui/material';
import { AutoAwesome, Close, Send, Link as LinkIcon } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { cpCopilotAPI } from '../../services/api';

const STARTER_PROMPTS = [
  'How is my pipeline this month?',
  'Which developer should I push more leads to?',
  'What is my realisation rate this quarter?',
  'Show me prospects pending follow-up today.',
];

const CpCopilotDrawer = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]); // [{ role, text, citations? }]
  const [conversationId, setConversationId] = useState(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  // Keyboard shortcut: Cmd+J / Ctrl+J — matches dev FAB.
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: msg }]);
    setBusy(true);
    try {
      const res = await cpCopilotAPI.message({ message: msg, conversationId });
      const data = res.data?.data || res.data || {};
      setConversationId(data.conversationId || conversationId);
      const r = data.response || {};
      setMessages((m) => [...m, {
        role: 'assistant',
        text: r.text || '(no response)',
        citations: r.citations || [],
        toolCallsExecuted: r.toolCallsExecuted || [],
      }]);
    } catch (err) {
      const data = err.response?.data;
      const errMsg = data?.message || err.message || 'Sorry, something went wrong.';
      setMessages((m) => [...m, { role: 'assistant', text: errMsg, isError: true }]);
    } finally {
      setBusy(false);
    }
  }, [input, conversationId]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <Tooltip title="AI Copilot (⌘J)" placement="left">
        <Fab
          color="primary"
          onClick={() => setOpen((o) => !o)}
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: (t) => t.zIndex.drawer + 2 }}
        >
          <AutoAwesome />
        </Fab>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: { width: { xs: '100vw', sm: 440 }, display: 'flex', flexDirection: 'column' } }}
      >
        <Stack direction="row" alignItems="center" sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <AutoAwesome sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>AI Copilot</Typography>
          <IconButton onClick={() => setOpen(false)} size="small"><Close /></IconButton>
        </Stack>

        <Box ref={scrollRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
          {messages.length === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Ask about your pipeline, commissions, developers, agents, or reconciliation.
                Citations link directly to the relevant records.
              </Typography>
              <Stack spacing={1}>
                {STARTER_PROMPTS.map((p) => (
                  <Chip key={p} label={p} onClick={() => send(p)} sx={{ justifyContent: 'flex-start', cursor: 'pointer' }} />
                ))}
              </Stack>
            </Box>
          )}

          {messages.map((m, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {m.role === 'user' ? 'You' : 'Copilot'}
              </Typography>
              <Box
                sx={{
                  mt: 0.5, p: 1.5, borderRadius: 2,
                  bgcolor: m.role === 'user' ? 'primary.50' : 'background.default',
                  border: '1px solid',
                  borderColor: m.isError ? 'error.light' : 'divider',
                  whiteSpace: 'pre-wrap',
                }}
              >
                <Typography variant="body2" sx={{ lineHeight: 1.5 }}>{m.text}</Typography>
                {m.citations && m.citations.length > 0 && (
                  <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      <LinkIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                      {m.citations.length} {m.citations.length === 1 ? 'source' : 'sources'}
                    </Typography>
                    <List dense disablePadding>
                      {m.citations.slice(0, 6).map((url, ci) => (
                        <ListItemButton key={`${url}-${ci}`} component={RouterLink} to={url} sx={{ py: 0.25, pl: 1 }}>
                          <ListItemText primary={url} primaryTypographyProps={{ variant: 'caption', sx: { color: 'primary.main' } }} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            </Box>
          ))}

          {busy && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <CircularProgress size={14} />
              <Typography variant="caption" color="text.secondary">Thinking…</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            multiline
            maxRows={4}
            placeholder="Ask the Copilot…  (⌘J to toggle, Enter to send)"
            value={input}
            disabled={busy}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => send()} disabled={busy || !input.trim()}>
                    <Send fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Drawer>
    </>
  );
};

export default CpCopilotDrawer;

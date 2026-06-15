// File: src/components/reports/ReportChatDock.js
import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, TextField, IconButton, Typography, CircularProgress, Stack, Chip } from '@mui/material';
import { AutoAwesome, Send } from '@mui/icons-material';

const STARTERS = [
  'Quarterly review for the whole portfolio — sales, collections, lead funnel.',
  'Monthly collections report for one project.',
  'Compare my projects on sales and collection rate.',
];

const ReportChatDock = ({ messages = [], isLoading = false, onSend }) => {
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  const submit = (text) => { const t = (text != null ? text : input); if (t.trim()) { onSend(t); setInput(''); } };

  return (
    <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 2, p: 1.5 }}>
      {messages.length > 0 && (
        <Box sx={{ maxHeight: 180, overflow: 'auto', mb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {messages.map((m, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              <Box sx={{ width: 26, height: 26, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: m.role === 'user' ? 'grey.200' : 'primary.main', color: m.role === 'user' ? 'text.primary' : '#fff', fontSize: 13, fontWeight: 700 }}>
                {m.role === 'user' ? 'You' : <AutoAwesome sx={{ fontSize: 15 }} />}
              </Box>
              <Typography variant="body2" sx={{ bgcolor: m.role === 'user' ? 'grey.100' : 'action.hover', px: 1.5, py: 1, borderRadius: 2, maxWidth: '80%' }}>
                {m.content}
              </Typography>
            </Box>
          ))}
          {isLoading && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', color: 'text.secondary' }}>
              <CircularProgress size={14} /> <Typography variant="caption">Working…</Typography>
            </Box>
          )}
          <div ref={endRef} />
        </Box>
      )}
      {messages.length === 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
          {STARTERS.map((s) => (
            <Chip key={s} label={s} variant="outlined" size="small" onClick={() => submit(s)} sx={{ height: 'auto', py: 0.5, '& .MuiChip-label': { whiteSpace: 'normal' } }} />
          ))}
        </Stack>
      )}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
        <TextField fullWidth multiline maxRows={4} size="small" placeholder="Ask the assistant to build or change the report…"
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} disabled={isLoading} />
        <IconButton color="primary" onClick={() => submit()} disabled={isLoading || !input.trim()}><Send /></IconButton>
      </Box>
    </Paper>
  );
};

export default ReportChatDock;

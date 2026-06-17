// src/pages/workspace/NLInput.js
import React, { useState } from 'react';
import { Box, TextField, Button, Alert, Typography, CircularProgress } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { workspaceAPI } from '../../services/api';

const NLInput = ({ module, onPlan }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [clarification, setClarification] = useState(null);
  const [error, setError] = useState(null);

  const handleCompile = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setClarification(null);
    setError(null);
    try {
      const res = await workspaceAPI.nlToQueryPlan(text.trim(), module);
      const data = res.data?.data || {};
      if (data.clarification) {
        setClarification(data.clarification);
      } else if (data.plan) {
        // Hand the compiled plan (+ optional chart spec) to the dialog; it
        // switches to the Builder tab so the user can review/edit, and into
        // Chart mode if the request described a chart.
        onPlan({ ...data.plan, nlSource: text.trim() }, data.chart || null);
      } else {
        setError('Could not understand that. Try rephrasing.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to compile your request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Describe what you want to see and we'll build the filter. You can edit it after.
      </Typography>
      <TextField
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`e.g. "leads where the channel partner hasn't followed up in 15 days"`}
        fullWidth
        multiline
        minRows={2}
        size="small"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCompile();
        }}
      />
      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
          onClick={handleCompile}
          disabled={loading || !text.trim()}
          sx={{ textTransform: 'none' }}
        >
          {loading ? 'Building…' : 'Build filter'}
        </Button>
        <Typography variant="caption" color="text.disabled">⌘/Ctrl + Enter</Typography>
      </Box>

      {clarification && (
        <Alert severity="info" sx={{ mt: 2 }}>{clarification}</Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}
    </Box>
  );
};

export default NLInput;

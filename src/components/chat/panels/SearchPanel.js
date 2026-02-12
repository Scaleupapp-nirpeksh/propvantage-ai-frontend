import React, { useState, useCallback } from 'react';
import {
  Drawer, Box, Typography, IconButton, TextField, InputAdornment,
  List, ListItemButton, ListItemText, CircularProgress, Chip,
  alpha, useTheme,
} from '@mui/material';
import { Close, Search } from '@mui/icons-material';
import { useChat } from '../../../context/ChatContext';
import { formatRelativeTime, truncateText } from '../../../utils/formatters';

const SearchPanel = ({ open, conversationId, onClose, onNavigateToMessage }) => {
  const theme = useTheme();
  const { searchMessages } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (query.length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const msgs = await searchMessages(query, conversationId);
      setResults(msgs);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, [query, conversationId, searchMessages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={() => { onClose(); setQuery(''); setResults([]); setSearched(false); }}
      PaperProps={{ sx: { width: { xs: '100%', sm: 380 }, p: 0 } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" fontWeight={600}>Search Messages</Typography>
        <IconButton size="small" onClick={() => { onClose(); setQuery(''); setResults([]); setSearched(false); }}>
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, py: 2 }}>
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search... (min 2 characters)"
          size="small"
          fullWidth
          autoFocus
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 20, color: 'text.secondary' }} /></InputAdornment>,
          }}
        />
        {!conversationId && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Searching across all conversations
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : results.length === 0 && searched ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, px: 3 }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No messages found for "{query}"
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {results.map((msg) => (
              <ListItemButton
                key={msg._id}
                onClick={() => onNavigateToMessage(msg.conversation?._id || msg.conversation)}
                sx={{ px: 3, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" fontWeight={600}>
                          {msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : 'System'}
                        </Typography>
                        {msg.conversation?.name && (
                          <Chip
                            label={msg.conversation.name}
                            size="small"
                            sx={{ height: 18, fontSize: '0.6rem', bgcolor: alpha(theme.palette.grey[500], 0.1) }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatRelativeTime(msg.createdAt)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.primary">
                      {truncateText(msg.content?.text || '', 120)}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

export default SearchPanel;

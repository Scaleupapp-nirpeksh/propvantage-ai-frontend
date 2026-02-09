// File: src/components/copilot/CopilotChat.js
// Description: Main AI Copilot floating chat panel
// Features: message list, card rendering, follow-up chips, actions, typing indicator

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Slide,
  alpha,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import {
  Close,
  Send,
  AutoAwesome,
  Add,
  OpenInNew,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useCopilotChat from '../../hooks/useCopilotChat';
import CardRenderer from './cards/CardRenderer';

// Starter questions shown on empty state
const STARTER_QUESTIONS = [
  'How is business this month?',
  'Show me high priority leads',
  'Revenue collected this month?',
  'What should I focus on today?',
];

// Typing indicator dots animation
const TypingIndicator = () => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 2, py: 1.5 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <AutoAwesome sx={{ fontSize: 16, color: 'primary.main' }} />
      </Box>
      <Box
        sx={{
          bgcolor: 'grey.100',
          borderRadius: '12px 12px 12px 4px',
          px: 2,
          py: 1.25,
          display: 'flex',
          gap: 0.5,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'grey.400',
              animation: 'copilotBounce 1.4s infinite ease-in-out both',
              animationDelay: `${i * 0.16}s`,
              '@keyframes copilotBounce': {
                '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
                '40%': { transform: 'scale(1)', opacity: 1 },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

// Empty state with welcome and starter questions
const EmptyState = ({ onQuestionClick }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        py: 4,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '16px',
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        <AutoAwesome sx={{ fontSize: 28, color: 'primary.main' }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, fontSize: '1rem' }}>
        PropVantage AI
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, maxWidth: 280 }}>
        Ask anything about your projects, sales, leads, payments, or team performance.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', maxWidth: 300 }}>
        {STARTER_QUESTIONS.map((q) => (
          <Chip
            key={q}
            label={q}
            variant="outlined"
            onClick={() => onQuestionClick(q)}
            sx={{
              height: 'auto',
              py: 0.75,
              px: 0.5,
              justifyContent: 'flex-start',
              '& .MuiChip-label': {
                whiteSpace: 'normal',
                fontSize: '0.75rem',
              },
              borderColor: 'grey.300',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderColor: 'primary.light',
              },
              cursor: 'pointer',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

// Single user message bubble
const UserMessage = ({ content }) => (
  <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 2, py: 0.5 }}>
    <Box
      sx={{
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        borderRadius: '12px 12px 4px 12px',
        px: 2,
        py: 1,
        maxWidth: '85%',
      }}
    >
      <Typography variant="body2" sx={{ fontSize: '0.813rem', lineHeight: 1.5 }}>
        {content}
      </Typography>
    </Box>
  </Box>
);

// System/error message
const SystemMessage = ({ content }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', px: 2, py: 0.5 }}>
    <Box
      sx={{
        bgcolor: 'grey.100',
        borderRadius: 2,
        px: 2,
        py: 0.75,
        maxWidth: '90%',
      }}
    >
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
        {content}
      </Typography>
    </Box>
  </Box>
);

// AI assistant message with cards, actions, follow-ups
const AssistantMessage = ({ message, onFollowUp, onNavigate }) => {
  const theme = useTheme();
  const response = message.response;

  return (
    <Box sx={{ display: 'flex', gap: 1, px: 2, py: 0.5, alignItems: 'flex-start' }}>
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          mt: 0.25,
        }}
      >
        <AutoAwesome sx={{ fontSize: 14, color: 'primary.main' }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, maxWidth: '92%' }}>
        {/* Text response */}
        <Box
          sx={{
            bgcolor: 'grey.50',
            borderRadius: '12px 12px 12px 4px',
            px: 2,
            py: 1.25,
            mb: 0.75,
            border: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.813rem',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              '& strong': { fontWeight: 600 },
            }}
          >
            {message.content}
          </Typography>
        </Box>

        {/* Cards */}
        {response?.cards?.map((card, i) => (
          <CardRenderer key={i} card={card} />
        ))}

        {/* Actions */}
        {response?.actions?.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 0.75 }}>
            {response.actions.map((action, i) => (
              <Button
                key={i}
                size="small"
                variant="outlined"
                endIcon={<OpenInNew sx={{ fontSize: '12px !important' }} />}
                onClick={() => onNavigate(action.path)}
                sx={{
                  fontSize: '0.688rem',
                  py: 0.25,
                  px: 1,
                  textTransform: 'none',
                  borderColor: 'grey.300',
                  color: 'text.primary',
                  '&:hover': { borderColor: 'primary.light', bgcolor: 'primary.50' },
                }}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        )}

        {/* Follow-up questions */}
        {response?.followUpQuestions?.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {response.followUpQuestions.map((q, i) => (
              <Chip
                key={i}
                label={q}
                size="small"
                variant="outlined"
                onClick={() => onFollowUp(q)}
                sx={{
                  height: 'auto',
                  py: 0.25,
                  fontSize: '0.688rem',
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  color: 'primary.dark',
                  cursor: 'pointer',
                  '& .MuiChip-label': { whiteSpace: 'normal', lineHeight: 1.3 },
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    borderColor: 'primary.main',
                  },
                }}
              />
            ))}
          </Box>
        )}

        {/* Sources */}
        {response?.sources?.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
            {response.sources.map((src) => (
              <Typography
                key={src}
                variant="caption"
                sx={{
                  fontSize: '0.625rem',
                  color: 'text.disabled',
                  bgcolor: 'grey.100',
                  px: 0.75,
                  py: 0.125,
                  borderRadius: 0.75,
                }}
              >
                {src}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Main CopilotChat component
const CopilotChat = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const {
    messages,
    isLoading,
    isRateLimited,
    sendMessage,
    resetChat,
  } = useCopilotChat();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading || isRateLimited) return;
    sendMessage(input.trim());
    setInput('');
  }, [input, isLoading, isRateLimited, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFollowUp = (text) => {
    sendMessage(text);
  };

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const handleNewChat = () => {
    resetChat();
    setInput('');
  };

  const panelWidth = isMobile ? '100vw' : 400;

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          // On mobile: fill entire screen using inset, avoids Safari 100vh address bar issue
          top: isMobile ? 0 : 'auto',
          left: isMobile ? 0 : 'auto',
          bottom: isMobile ? 0 : 24,
          right: isMobile ? 0 : 24,
          width: isMobile ? '100%' : panelWidth,
          height: isMobile ? '100%' : 'calc(100vh - 100px)',
          maxHeight: isMobile ? 'none' : 640,
          bgcolor: 'background.paper',
          borderRadius: isMobile ? 0 : 3,
          boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
          border: isMobile ? 'none' : `1px solid ${theme.palette.divider}`,
          display: 'flex',
          flexDirection: 'column',
          zIndex: theme.zIndex.modal + 1,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AutoAwesome sx={{ fontSize: 18, color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                AI Copilot
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.625rem' }}>
                Ask anything about your business
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handleNewChat}
              title="New conversation"
              sx={{ color: 'text.secondary' }}
            >
              <Add sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Messages area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            py: 1,
            display: 'flex',
            flexDirection: 'column',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'grey.300',
              borderRadius: 2,
            },
          }}
        >
          {messages.length === 0 && !isLoading ? (
            <EmptyState onQuestionClick={handleFollowUp} />
          ) : (
            <>
              {messages.map((msg) => {
                if (msg.role === 'user') return <UserMessage key={msg.id} content={msg.content} />;
                if (msg.role === 'system') return <SystemMessage key={msg.id} content={msg.content} />;
                return (
                  <AssistantMessage
                    key={msg.id}
                    message={msg}
                    onFollowUp={handleFollowUp}
                    onNavigate={handleNavigate}
                  />
                );
              })}
              {isLoading && <TypingIndicator />}
            </>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input area */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {isRateLimited && (
            <Typography
              variant="caption"
              sx={{ color: 'warning.main', fontSize: '0.688rem', mb: 0.5, display: 'block' }}
            >
              Rate limited — please wait a moment before sending.
            </Typography>
          )}
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder={isRateLimited ? 'Please wait...' : 'Ask a question...'}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 2000))}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isRateLimited}
            inputRef={inputRef}
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || isRateLimited}
                    sx={{
                      color: input.trim() ? 'primary.main' : 'grey.400',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                    }}
                  >
                    <Send sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2.5,
                bgcolor: 'grey.50',
                fontSize: '0.813rem',
                '& fieldset': { borderColor: 'grey.200' },
              },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: 'text.disabled',
              fontSize: '0.625rem',
              mt: 0.5,
              display: 'block',
              textAlign: 'center',
            }}
          >
            AI answers are generated from your live data
          </Typography>
        </Box>
      </Box>
    </Slide>
  );
};

export default CopilotChat;

// src/pages/home/HomePage.js
// Claude-style welcome/home screen: a time-of-day greeting + the user's title,
// a single "what do you want to do today?" composer, and a stacked results area.
// Each request is routed by POST /home/intent into one of:
//   action  → a confirm chip that navigates to a create/open page
//   data    → an inline My-View-style card with "Add to My View"
//   question→ answered by the existing AI Copilot, rendered inline
//   clarify → a short follow-up question
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Box, Container, Paper, Typography, TextField, IconButton, Chip, Stack,
  CircularProgress, Button, Divider,
} from '@mui/material';
import {
  ArrowUpward, AutoAwesome, PersonAddAlt, AddHomeWork, ReceiptLong, TaskAlt,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { homeAPI, copilotAPI } from '../../services/api';
import CardRenderer from '../../components/copilot/cards/CardRenderer';
import HomeDataCard from './HomeDataCard';

const VISITS_KEY = 'pv.home.visits';

const greetingFor = (hour) => {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good evening';
};

// entity + mode → app route (conservative: only true /create pages route to create).
const ROUTES = {
  lead: { create: '/leads/create', open: '/leads' },
  project: { create: '/projects/create', open: '/projects' },
  sale: { create: '/sales/create', open: '/sales' },
  task: { create: '/tasks/create', open: '/tasks' },
  payment: { create: '/payments', open: '/payments' },
  channelPartner: { create: '/channel-partners', open: '/channel-partners' },
};
const routeFor = (entity, mode) => ROUTES[entity]?.[mode] || ROUTES[entity]?.open || '/';

const QUICK_ACTIONS = [
  { label: 'Create lead', icon: <PersonAddAlt fontSize="small" />, route: '/leads/create' },
  { label: 'Create project', icon: <AddHomeWork fontSize="small" />, route: '/projects/create' },
  { label: 'Log a sale', icon: <ReceiptLong fontSize="small" />, route: '/sales/create' },
  { label: 'New task', icon: <TaskAlt fontSize="small" />, route: '/tasks/create' },
];

const EXAMPLES = [
  'Leads with no follow-up in the last 30 days',
  'How is business this month?',
  'Bookings pending approval',
];

// ── Result renderers ─────────────────────────────────────────────────────────
const ActionResult = ({ item, onNavigate }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
    <Typography variant="body1">{item.label}?</Typography>
    <Button variant="contained" onClick={() => onNavigate(item.route)} sx={{ textTransform: 'none' }}>
      {item.label}
    </Button>
  </Paper>
);

const ClarifyResult = ({ item }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Typography variant="body2" color="text.secondary">{item.clarification}</Typography>
  </Paper>
);

const QuestionResult = ({ text }) => {
  const [state, setState] = useState({ loading: true, response: null, error: false });
  useEffect(() => {
    let cancelled = false;
    copilotAPI
      .chat({ message: text, context: { currentPage: 'home' } })
      .then((res) => { if (!cancelled) setState({ loading: false, response: res.data?.data?.response || null, error: false }); })
      .catch(() => { if (!cancelled) setState({ loading: false, response: null, error: true }); });
    return () => { cancelled = true; };
  }, [text]);

  if (state.loading) {
    return (
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} /> <Typography variant="body2" color="text.secondary">Thinking…</Typography>
      </Paper>
    );
  }
  if (state.error || !state.response) {
    return (
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">I couldn’t answer that just now. Try rephrasing.</Typography>
      </Paper>
    );
  }
  const { text: answer, cards = [] } = state.response;
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      {answer && <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: cards.length ? 1.5 : 0 }}>{answer}</Typography>}
      <Stack spacing={1.5}>
        {cards.map((c, i) => <CardRenderer key={i} card={c} />)}
      </Stack>
    </Paper>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();
  const { user, roleRef, isChannelPartnerOrg } = useAuth();
  const firstName = user?.firstName || 'there';
  // Role title lives in the top-level roleRef (populated role) — fall back to the
  // legacy user.role string (what User Management renders).
  const title = roleRef?.name || user?.role || null;

  const [returning, setReturning] = useState(false);
  const [text, setText] = useState('');
  const [results, setResults] = useState([]); // { id, kind, input, ... }
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);
  const endRef = useRef(null);

  useEffect(() => {
    const n = Number(localStorage.getItem(VISITS_KEY) || '0') + 1;
    localStorage.setItem(VISITS_KEY, String(n));
    setReturning(n > 1);
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [results]);

  const greeting = returning ? `Welcome back, ${firstName}` : `${greetingFor(new Date().getHours())}, ${firstName}`;
  const prompt = returning ? 'What would you like to do next?' : 'What would you like to do today?';

  const submit = useCallback(async (raw) => {
    const q = (raw ?? text).trim();
    if (!q || busy) return;
    setText('');
    setBusy(true);
    const id = ++seq.current;
    setResults((prev) => [...prev, { id, kind: 'pending', input: q }]);
    try {
      const res = await homeAPI.intent(q);
      const data = res.data?.data || { kind: 'clarify', clarification: 'Could you rephrase that?' };
      let item;
      if (data.kind === 'action') {
        item = { id, kind: 'action', input: q, label: data.label, route: routeFor(data.entity, data.mode) };
      } else if (data.kind === 'data') {
        item = { id, kind: 'data', input: q, card: data.card };
      } else if (data.kind === 'question') {
        item = { id, kind: 'question', input: q, text: data.text || q };
      } else {
        item = { id, kind: 'clarify', input: q, clarification: data.clarification || 'Could you add a bit more detail?' };
      }
      setResults((prev) => prev.map((r) => (r.id === id ? item : r)));
    } catch {
      setResults((prev) => prev.map((r) => (r.id === id ? { id, kind: 'clarify', input: q, clarification: 'Something went wrong. Try again.' } : r)));
    } finally {
      setBusy(false);
    }
  }, [text, busy]);

  // Channel-partner-org users have their own dashboard (mirror WorkspacePage).
  if (isChannelPartnerOrg) return <Navigate to="/partner/dashboard" replace />;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      {/* Greeting */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h3" fontWeight={800} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome sx={{ color: 'primary.main', fontSize: 32 }} /> {greeting}
        </Typography>
        {title && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>{title}</Typography>
        )}
      </Box>

      {/* Composer */}
      <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, p: 1.5, mb: 1.5 }}>
        <TextField
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={prompt}
          fullWidth
          multiline
          maxRows={5}
          variant="standard"
          InputProps={{ disableUnderline: true, sx: { px: 1, py: 0.5, fontSize: '1.05rem' } }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
          <IconButton color="primary" disabled={busy || !text.trim()} onClick={() => submit()} sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'action.disabledBackground' } }}>
            {busy ? <CircularProgress size={18} color="inherit" /> : <ArrowUpward fontSize="small" />}
          </IconButton>
        </Box>
      </Paper>

      {/* Quick actions + examples */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center" sx={{ mb: 1 }}>
        {QUICK_ACTIONS.map((a) => (
          <Chip key={a.label} icon={a.icon} label={a.label} variant="outlined" onClick={() => navigate(a.route)} sx={{ cursor: 'pointer' }} />
        ))}
      </Stack>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center" sx={{ mb: 3 }}>
        {EXAMPLES.map((ex) => (
          <Chip key={ex} label={ex} size="small" onClick={() => submit(ex)} sx={{ cursor: 'pointer', bgcolor: 'action.hover' }} />
        ))}
      </Stack>

      {/* Results stack */}
      {results.length > 0 && <Divider sx={{ mb: 2 }} />}
      <Stack spacing={2}>
        {results.map((r) => (
          <Box key={r.id}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>“{r.input}”</Typography>
            {r.kind === 'pending' && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} /> <Typography variant="body2" color="text.secondary">Working on it…</Typography>
              </Paper>
            )}
            {r.kind === 'action' && <ActionResult item={r} onNavigate={navigate} />}
            {r.kind === 'data' && <HomeDataCard card={r.card} />}
            {r.kind === 'question' && <QuestionResult text={r.text} />}
            {r.kind === 'clarify' && <ClarifyResult item={r} />}
          </Box>
        ))}
        <div ref={endRef} />
      </Stack>
    </Container>
  );
};

export default HomePage;

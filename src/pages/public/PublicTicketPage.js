// File: src/pages/public/PublicTicketPage.js
// PUBLIC, no-auth ticket status page (route /t/:token). Polls every ~20s.
// Uses publicTicketAPI which hits the interceptor-free `publicApi` instance,
// so anonymous viewers never send an auth header or trigger the 401-refresh flow.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Stack, CircularProgress } from '@mui/material';
import { publicTicketAPI } from '../../services/api';

/* ------------------------------------------------------------------ *
 * Design tokens — mirrors the client email we ship, so the brand
 * stays consistent across email + this status page.
 * ------------------------------------------------------------------ */
const C = {
  ink: '#0F172A',
  gold: '#B08D57',
  goldSoft: 'rgba(176, 141, 87, 0.10)',
  paper: '#F4F2EE',
  white: '#FFFFFF',
  hairline: '#E7E3DC',
  muted: '#6B7280',
  green: '#3F7E5C',
  greenSoft: 'rgba(63, 126, 92, 0.10)',
  slate: '#64748B',
  slateSoft: 'rgba(100, 116, 139, 0.08)',
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const BRAND = process.env.REACT_APP_SUPPORT_BRAND || 'PropVantage';

/* ------------------------------------------------------------------ *
 * Client-friendly status mapping. `active` states wear a gold outline,
 * resolved wears a calm green, closed wears muted slate.
 * ------------------------------------------------------------------ */
const STATUS_META = {
  new: { label: 'Received', tone: 'gold' },
  assigned: { label: 'Received', tone: 'gold' },
  in_progress: { label: 'In progress', tone: 'gold' },
  waiting_on_client: { label: 'Awaiting your reply', tone: 'gold' },
  resolved: { label: 'Resolved', tone: 'green' },
  closed: { label: 'Closed', tone: 'slate' },
};

const statusMeta = (s) => STATUS_META[s] || { label: s || 'In progress', tone: 'gold' };

const TONE = {
  gold: { fg: C.gold, bg: C.goldSoft, border: C.gold, dot: C.gold },
  green: { fg: C.green, bg: C.greenSoft, border: C.green, dot: C.green },
  slate: { fg: C.slate, bg: C.slateSoft, border: '#CBD2DA', dot: C.slate },
};

const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString(undefined, {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
};

const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const POLL_MS = 20000;

/* ------------------------------------------------------------------ *
 * Shared shell — wordmark + the single elegant card with the thin
 * gold→ink gradient top border.
 * ------------------------------------------------------------------ */
const PageShell = ({ children }) => (
  <Box
    sx={{
      bgcolor: C.paper,
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      px: { xs: 2, sm: 3 },
      py: { xs: 5, md: 8 },
      fontFamily: SANS,
    }}
  >
    <Box sx={{ width: '100%', maxWidth: 620 }}>
      {/* Wordmark */}
      <Box sx={{ textAlign: 'center', mb: { xs: 3, md: 4 } }}>
        <Typography
          sx={{
            fontFamily: SERIF,
            fontSize: { xs: 24, md: 27 },
            fontWeight: 500,
            color: C.ink,
            lineHeight: 1,
          }}
        >
          {BRAND}
        </Typography>
        <Typography
          sx={{
            mt: 0.75,
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.32em',
            color: C.gold,
            textTransform: 'uppercase',
          }}
        >
          Support
        </Typography>
      </Box>

      {/* Card */}
      <Box
        sx={{
          position: 'relative',
          bgcolor: C.white,
          borderRadius: '16px',
          border: `1px solid ${C.hairline}`,
          boxShadow: '0 24px 60px -28px rgba(15, 23, 42, 0.18)',
          overflow: 'hidden',
        }}
      >
        {/* Thin gold→ink gradient top border */}
        <Box
          sx={{
            height: '3px',
            width: '100%',
            background: `linear-gradient(90deg, ${C.gold} 0%, ${C.ink} 100%)`,
          }}
        />
        <Box sx={{ p: { xs: 3, sm: 4, md: 5 } }}>{children}</Box>
      </Box>

      {/* Footer */}
      <Typography
        sx={{
          mt: 3,
          textAlign: 'center',
          fontSize: 12.5,
          color: C.muted,
          lineHeight: 1.7,
        }}
      >
        This page updates automatically.
        <Box component="span" sx={{ display: 'block', mt: 0.25 }}>
          {BRAND} · Client Support
        </Box>
      </Typography>
    </Box>
  </Box>
);

/* ------------------------------------------------------------------ *
 * Status pill
 * ------------------------------------------------------------------ */
const StatusPill = ({ status }) => {
  const m = statusMeta(status);
  const tone = TONE[m.tone] || TONE.gold;
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.9,
        px: 1.6,
        py: 0.7,
        borderRadius: 999,
        border: `1px solid ${tone.border}`,
        bgcolor: tone.bg,
      }}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: tone.dot,
          flexShrink: 0,
        }}
      />
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: tone.fg,
          whiteSpace: 'nowrap',
        }}
      >
        {m.label}
      </Typography>
    </Box>
  );
};

/* ------------------------------------------------------------------ *
 * Small uppercase eyebrow label
 * ------------------------------------------------------------------ */
const Eyebrow = ({ children, sx }) => (
  <Typography
    sx={{
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: C.gold,
      ...sx,
    }}
  >
    {children}
  </Typography>
);

const Hairline = ({ my }) => (
  <Box sx={{ height: '1px', bgcolor: C.hairline, my }} />
);

/* ------------------------------------------------------------------ *
 * Timeline
 * ------------------------------------------------------------------ */
const TimelineDot = ({ color }) => (
  <Box
    sx={{
      position: 'absolute',
      left: { xs: 0, sm: 2 },
      top: 4,
      width: 11,
      height: 11,
      borderRadius: '50%',
      bgcolor: C.white,
      border: `2px solid ${color}`,
      boxSizing: 'border-box',
      zIndex: 1,
    }}
  />
);

const StatusMarker = ({ item }) => {
  const m = statusMeta(item.status);
  const tone = TONE[m.tone] || TONE.gold;
  return (
    <Box sx={{ position: 'relative', pl: { xs: 3, sm: 4 } }}>
      <TimelineDot color={tone.dot} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 1 }}>
        <Typography
          sx={{
            fontSize: 12.5,
            color: C.ink,
            fontWeight: 500,
          }}
        >
          Status
          <Box component="span" sx={{ color: C.muted, mx: 0.75 }}>→</Box>
          <Box component="span" sx={{ color: tone.fg, fontWeight: 600 }}>
            {m.label}
          </Box>
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: C.muted }}>
          {formatTime(item.at)}
        </Typography>
      </Box>
    </Box>
  );
};

const MessageEntry = ({ item }) => {
  const isInbound = item.direction === 'inbound';
  const who = isInbound ? 'You' : item.author || 'Support team';
  const accent = isInbound ? C.slate : C.gold;
  return (
    <Box sx={{ position: 'relative', pl: { xs: 3, sm: 4 } }}>
      <TimelineDot color={accent} />
      <Box
        sx={{
          borderRadius: '12px',
          border: `1px solid ${C.hairline}`,
          bgcolor: isInbound ? '#FBFAF8' : C.goldSoft,
          borderColor: isInbound ? C.hairline : 'rgba(176, 141, 87, 0.28)',
          px: 2,
          py: 1.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 1,
            mb: 0.75,
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: isInbound ? C.slate : C.gold,
            }}
          >
            {who}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: C.muted }}>
            {formatTime(item.at)}
          </Typography>
        </Box>
        <Typography
          sx={{
            fontSize: 14,
            lineHeight: 1.65,
            color: C.ink,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {item.body || '—'}
        </Typography>
      </Box>
    </Box>
  );
};

/* ------------------------------------------------------------------ *
 * Loading skeleton — same card shell so the transition is calm.
 * ------------------------------------------------------------------ */
const skeletonShimmer = {
  borderRadius: '8px',
  background: `linear-gradient(90deg, ${C.paper} 25%, #ECE9E3 50%, ${C.paper} 75%)`,
  backgroundSize: '200% 100%',
  animation: 'pvtShimmer 1.4s ease-in-out infinite',
  '@keyframes pvtShimmer': {
    '0%': { backgroundPosition: '200% 0' },
    '100%': { backgroundPosition: '-200% 0' },
  },
};

const LoadingState = () => (
  <PageShell>
    <Stack spacing={2.5}>
      <Box sx={{ ...skeletonShimmer, height: 12, width: 120 }} />
      <Box sx={{ ...skeletonShimmer, height: 26, width: '78%' }} />
      <Box sx={{ ...skeletonShimmer, height: 30, width: 130, borderRadius: '999px' }} />
      <Hairline my={1.5} />
      <Box sx={{ ...skeletonShimmer, height: 64, width: '100%' }} />
      <Box sx={{ ...skeletonShimmer, height: 64, width: '100%' }} />
    </Stack>
  </PageShell>
);

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */
const PublicTicketPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | viewing | error
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyErr, setReplyErr] = useState(null);
  const [justSent, setJustSent] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async (initial) => {
    try {
      const res = await publicTicketAPI.get(token);
      if (!mounted.current) return;
      setTicket(res.data?.data || null);
      setLastSync(Date.now());
      setStatus('viewing');
    } catch (err) {
      if (!mounted.current) return;
      // Only surface an error on the first load; transient poll failures are ignored.
      if (initial) {
        setError(err.response?.status === 404
          ? 'This ticket link is invalid or has expired.'
          : (err.response?.data?.message || 'Could not load this ticket.'));
        setStatus('error');
      }
    }
  }, [token]);

  useEffect(() => {
    mounted.current = true;
    load(true);
    const interval = setInterval(() => load(false), POLL_MS);
    return () => { mounted.current = false; clearInterval(interval); };
  }, [load]);

  const submitReply = async () => {
    const body = replyText.trim();
    if (!body || sending) return;
    setSending(true);
    setReplyErr(null);
    try {
      const res = await publicTicketAPI.reply(token, body);
      if (!mounted.current) return;
      setTicket(res.data?.data || ticket);
      setReplyText('');
      setJustSent(true);
      setLastSync(Date.now());
    } catch (err) {
      if (!mounted.current) return;
      setReplyErr(err.response?.data?.message || 'Could not send your message. Please try again.');
    } finally {
      if (mounted.current) setSending(false);
    }
  };

  if (status === 'loading') {
    return <LoadingState />;
  }

  if (status === 'error') {
    return (
      <PageShell>
        <Box sx={{ textAlign: 'center', py: { xs: 2, md: 3 } }}>
          <Eyebrow sx={{ color: C.muted }}>Ticket</Eyebrow>
          <Typography
            sx={{
              fontFamily: SERIF,
              fontSize: { xs: 22, md: 26 },
              color: C.ink,
              mt: 1.5,
              mb: 1,
            }}
          >
            We couldn’t find that ticket
          </Typography>
          <Typography sx={{ fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 420, mx: 'auto' }}>
            {error || 'This link may be incorrect or no longer active. Please check the link in your email, or reply to that message and our team will be glad to help.'}
          </Typography>
        </Box>
      </PageShell>
    );
  }

  const timeline = (ticket?.timeline || []).slice().sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );

  return (
    <PageShell>
      {/* Header block */}
      <Box>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Eyebrow>Ticket · {ticket?.displayId || '—'}</Eyebrow>
            <Typography
              component="h1"
              sx={{
                fontFamily: SERIF,
                fontSize: { xs: 24, md: 30 },
                fontWeight: 500,
                color: C.ink,
                lineHeight: 1.25,
                mt: 1,
              }}
            >
              {ticket?.subject || 'Support request'}
            </Typography>
          </Box>
          <Box sx={{ flexShrink: 0, mt: { xs: 0.5, sm: 1.5 } }}>
            <StatusPill status={ticket?.status} />
          </Box>
        </Box>

        {/* Meta */}
        <Stack
          direction="row"
          spacing={{ xs: 3, sm: 5 }}
          sx={{ mt: 2.5 }}
        >
          <Box>
            <Typography
              sx={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.muted }}
            >
              Opened
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: C.ink, mt: 0.4 }}>
              {formatDate(ticket?.createdAt)}
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.muted }}
            >
              Last updated
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: C.ink, mt: 0.4 }}>
              {formatDate(ticket?.updatedAt)}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Hairline my={{ xs: 3, md: 3.5 }} />

      {/* Activity */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2.5,
        }}
      >
        <Eyebrow sx={{ color: C.ink, letterSpacing: '0.2em' }}>Activity</Eyebrow>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: C.green,
              boxShadow: `0 0 0 3px ${C.greenSoft}`,
              animation: 'pvtPulse 2.4s ease-in-out infinite',
              '@keyframes pvtPulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.35 },
              },
            }}
          />
          <Typography sx={{ fontSize: 11.5, color: C.muted }}>
            {lastSync ? 'Live' : 'Updated'}
          </Typography>
        </Box>
      </Box>

      {timeline.length === 0 ? (
        <Typography sx={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>
          There is no activity on this ticket yet. We’ll post updates here as our
          team works on your request.
        </Typography>
      ) : (
        <Box sx={{ position: 'relative' }}>
          {/* Vertical rule */}
          <Box
            sx={{
              position: 'absolute',
              left: { xs: 5, sm: 7 },
              top: 6,
              bottom: 6,
              width: '1px',
              bgcolor: C.hairline,
            }}
          />
          <Stack spacing={2.5}>
            {timeline.map((item, i) =>
              item.type === 'status' ? (
                <StatusMarker key={i} item={item} />
              ) : (
                <MessageEntry key={i} item={item} />
              ),
            )}
          </Stack>
        </Box>
      )}

      {/* Reply composer — clients can respond here directly, no login */}
      <Hairline my={{ xs: 3, md: 3.5 }} />
      <Eyebrow sx={{ color: C.ink, letterSpacing: '0.2em', mb: 1.5 }}>Add a reply</Eyebrow>

      {justSent && (
        <Box
          sx={{
            mb: 2, px: 2, py: 1.25, borderRadius: '12px',
            border: `1px solid ${TONE.green.border}`, bgcolor: C.greenSoft,
          }}
        >
          <Typography sx={{ fontSize: 13.5, color: C.green, fontWeight: 600 }}>
            Thank you — your message has been added to the ticket and our team has been notified.
          </Typography>
        </Box>
      )}

      <Box
        component="textarea"
        value={replyText}
        onChange={(e) => { setReplyText(e.target.value); if (justSent) setJustSent(false); }}
        placeholder="Write a message to the support team…"
        rows={4}
        disabled={sending}
        sx={{
          width: '100%',
          boxSizing: 'border-box',
          resize: 'vertical',
          fontFamily: SANS,
          fontSize: 14,
          lineHeight: 1.6,
          color: C.ink,
          p: 1.75,
          borderRadius: '12px',
          border: `1px solid ${C.hairline}`,
          outline: 'none',
          bgcolor: '#FBFAF8',
          '&:focus': { borderColor: C.gold, bgcolor: C.white },
          '&::placeholder': { color: C.muted },
        }}
      />

      {replyErr && (
        <Typography sx={{ fontSize: 12.5, color: '#B42318', mt: 1 }}>{replyErr}</Typography>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5, gap: 1.5 }}>
        <Typography sx={{ fontSize: 11.5, color: C.muted }}>
          You can also simply reply to our emails.
        </Typography>
        <Box
          component="button"
          type="button"
          onClick={submitReply}
          disabled={sending || !replyText.trim()}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2.5,
            py: 1.1,
            borderRadius: '999px',
            border: 'none',
            cursor: sending || !replyText.trim() ? 'default' : 'pointer',
            fontFamily: SANS,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.03em',
            color: C.white,
            bgcolor: C.ink,
            opacity: sending || !replyText.trim() ? 0.45 : 1,
            transition: 'opacity .15s ease, transform .15s ease',
            '&:hover': { transform: sending || !replyText.trim() ? 'none' : 'translateY(-1px)' },
          }}
        >
          {sending && <CircularProgress size={13} sx={{ color: C.white }} />}
          {sending ? 'Sending…' : 'Send reply'}
        </Box>
      </Box>
    </PageShell>
  );
};

export default PublicTicketPage;

// File: src/pages/pitch/MicroMittiPitchPage.jsx
// Description: MicroMitti (Indore) pitch landing — capability showcase, not a sales page.
// No pricing, no ROI-vs-cost, no CTA.
// Light "leave-behind microsite" design: warm paper ground, high-contrast ink,
// brass accent. Built to be re-explored after the meeting — sticky chapter nav,
// click-to-explore capabilities, interactive AI Q&A chips. One serif family
// (Spectral), monospace data labels, no emojis, no decorative icons.

import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Slider } from '@mui/material';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';

// ─── Tokens — light, warm, readable ────────────────────────────────
const C = {
  paper: '#F7F4EE',
  panel: '#FFFFFF',
  soft: '#EFEAE0',
  ink: '#211D16',
  inkMid: '#6C6459',
  inkDim: '#A39A8B',
  hairline: 'rgba(33, 29, 22, 0.12)',
  hairlineStrong: 'rgba(33, 29, 22, 0.26)',
  gold: '#8F6F2F',          // dark brass — legible on paper
  goldSoft: '#F1E7D2',
  red: '#A63D2F',
  redSoft: '#F7E4E0',
  green: '#3E6B4F',
  mutedSeg: '#E7E0D2',      // neutral bar segments
};

const SERIF = `'Spectral', 'Cormorant Garamond', 'EB Garamond', Georgia, serif`;
const SANS = `'Inter Tight', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`;
const MONO = `'JetBrains Mono', 'SF Mono', Menlo, monospace`;

// ─── Animated count-up ─────────────────────────────────────────────
const useCountUp = (target, duration = 1800, start = false) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return value;
};

// ─── Reveal on scroll ──────────────────────────────────────────────
const Reveal = ({ children, delay = 0, y = 24, ...rest }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

const InViewWrap = ({ children }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return <div ref={ref}>{children(inView)}</div>;
};

// ─── Primitives ────────────────────────────────────────────────────
const Section = ({ children, sx = {}, alt = false, id, ...rest }) => (
  <Box
    component="section"
    id={id}
    sx={{
      backgroundColor: alt ? C.soft : C.paper,
      color: C.ink,
      px: { xs: 4, sm: 7, md: 12, lg: 18 },
      py: { xs: 11, md: 17 },
      position: 'relative',
      scrollMarginTop: '76px',
      ...sx,
    }}
    {...rest}
  >
    {children}
  </Box>
);

const Kicker = ({ children, sx = {} }) => (
  <Typography
    sx={{
      fontFamily: MONO,
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: '0.28em',
      textTransform: 'uppercase',
      color: C.gold,
      mb: { xs: 4, md: 6 },
      ...sx,
    }}
  >
    {children}
  </Typography>
);

const Display = ({ children, sx = {}, as = 'h2' }) => (
  <Typography
    component={as}
    sx={{
      fontFamily: SERIF,
      fontWeight: 300,
      fontSize: { xs: '2.2rem', sm: '3rem', md: '4.2rem', lg: '4.8rem' },
      lineHeight: 1.05,
      letterSpacing: '-0.02em',
      color: C.ink,
      ...sx,
    }}
  >
    {children}
  </Typography>
);

const Body = ({ children, sx = {}, dim = false, lg = false }) => (
  <Typography
    sx={{
      fontFamily: SANS,
      fontSize: lg ? { xs: '1.1rem', md: '1.25rem' } : { xs: '1rem', md: '1.08rem' },
      lineHeight: 1.68,
      fontWeight: 400,
      color: dim ? C.inkMid : C.ink,
      ...sx,
    }}
  >
    {children}
  </Typography>
);

// Card panel used across sections
const Panel = ({ children, sx = {} }) => (
  <Box
    sx={{
      background: C.panel,
      border: `1px solid ${C.hairline}`,
      borderRadius: 3,
      boxShadow: '0 1px 2px rgba(33,29,22,0.04), 0 8px 28px rgba(33,29,22,0.05)',
      ...sx,
    }}
  >
    {children}
  </Box>
);

// Browser-chrome shell shared by all product mockups
const MockupShell = ({ url, children }) => (
  <Panel sx={{ overflow: 'hidden', maxWidth: 1100, borderRadius: 3 }}>
    <Box sx={{ background: C.soft, px: 3, py: 1.8, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${C.hairline}` }}>
      <Box sx={{ display: 'flex', gap: 0.7 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#E0564A' }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#E5A93D' }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#57A45B' }} />
      </Box>
      <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkMid, ml: 2 }}>
        {url}
      </Typography>
    </Box>
    <Box sx={{ p: { xs: 3.5, md: 5.5 } }}>{children}</Box>
  </Panel>
);

// ─── Sticky chapter nav ────────────────────────────────────────────
const CHAPTERS = [
  { id: 'stakes', label: 'The stakes' },
  { id: 'funnels', label: 'Two funnels' },
  { id: 'platform', label: 'The platform' },
  { id: 'ai', label: 'The AI' },
  { id: 'screens', label: 'Screens' },
  { id: 'math', label: 'The math' },
  { id: 'week', label: 'A week' },
  { id: 'note', label: 'A note' },
];

const ChapterNav = () => {
  const [active, setActive] = useState('');
  useEffect(() => {
    const onScroll = () => {
      let current = '';
      for (const ch of CHAPTERS) {
        const el = document.getElementById(ch.id);
        if (el && el.getBoundingClientRect().top <= 140) current = ch.id;
      }
      setActive(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const jump = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 150,
        background: 'rgba(247, 244, 238, 0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.hairline}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, md: 2 },
          px: { xs: 2.5, md: 6 },
          py: 1.6,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        <Typography
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          sx={{
            fontFamily: SERIF,
            fontWeight: 500,
            fontSize: 15,
            color: C.ink,
            cursor: 'pointer',
            mr: { xs: 1, md: 3 },
            flexShrink: 0,
          }}
        >
          PropVantage <Box component="span" sx={{ color: C.gold, fontStyle: 'italic' }}>× MicroMitti</Box>
        </Typography>
        {CHAPTERS.map((ch) => (
          <Box
            key={ch.id}
            onClick={() => jump(ch.id)}
            sx={{
              fontFamily: MONO,
              fontSize: 10.5,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              px: 1.4,
              py: 0.7,
              borderRadius: 5,
              flexShrink: 0,
              color: active === ch.id ? C.panel : C.inkMid,
              background: active === ch.id ? C.gold : 'transparent',
              transition: 'all 0.25s',
              '&:hover': { color: active === ch.id ? C.panel : C.ink },
            }}
          >
            {ch.label}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// ─── Hero ──────────────────────────────────────────────────────────
const Hero = () => {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 250);
    return () => clearTimeout(t);
  }, []);
  const v = useCountUp(70, 2000, started);

  return (
    <Section
      sx={{
        minHeight: '100vh',
        pt: { xs: 16, md: 22 },
        pb: { xs: 12, md: 16 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: started ? 1 : 0 }}
          transition={{ duration: 1.2 }}
          style={{ marginBottom: 40 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: { xs: 2, md: 3 } }}>
            <Box
              sx={{
                fontFamily: SERIF,
                fontWeight: 300,
                fontSize: { xs: '5rem', sm: '8rem', md: '12rem', lg: '15rem' },
                lineHeight: 0.85,
                letterSpacing: '-0.05em',
                color: C.ink,
              }}
            >
              {Math.round(v)}
            </Box>
            <Box
              sx={{
                fontFamily: SERIF,
                fontWeight: 300,
                fontStyle: 'italic',
                fontSize: { xs: '1.2rem', sm: '1.8rem', md: '2.4rem' },
                lineHeight: 1.15,
                color: C.gold,
                pb: { xs: 1, md: 2.5 },
              }}
            >
              letters of intent
            </Box>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.4 }}
        >
          <Display as="h1" sx={{ mb: 4, maxWidth: 1150 }}>
            Seventy letters of intent at <Box component="span" sx={{ fontStyle: 'italic', color: C.gold }}>CyberCity</Box>. Each one is a promise Indore is watching you keep.
          </Display>
          <Body lg dim sx={{ maxWidth: 700, mb: 6 }}>
            Launches make headlines. Follow-ups build institutions. This page is about
            the system that keeps every one of those seventy promises — and the few
            thousand smaller ones behind them.
          </Body>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Scroll, or jump by chapter above — this page is yours to explore
          </Typography>
        </motion.div>
      </Box>
    </Section>
  );
};

// ─── The stakes — LOI decay bar ────────────────────────────────────
const StakesBar = ({ visible }) => {
  const segments = [
    { flex: 60, bg: C.mutedSeg, ink: C.ink, sub: C.inkMid, count: '~42', label: 'Convert on momentum' },
    { flex: 26, bg: C.red, ink: '#FDF3F0', sub: '#F3D3CB', count: '~18', label: 'Slip on follow-through', isLeak: true },
    { flex: 14, bg: C.mutedSeg, ink: C.ink, sub: C.inkMid, count: '~10', label: 'Were never real' },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: '5px',
          height: { xs: 'auto', md: 160 },
          mb: { xs: 6, md: 8 },
        }}
      >
        {segments.map((s, idx) => (
          <Box
            key={idx}
            component={motion.div}
            initial={{ opacity: 0, scaleX: 0, transformOrigin: 'left center' }}
            animate={visible ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.15 + idx * 0.25, ease: [0.16, 1, 0.3, 1] }}
            sx={{
              flex: { xs: '0 0 auto', md: s.flex },
              minHeight: { xs: 84, md: 'auto' },
              background: s.bg,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'flex-end',
              padding: { xs: '16px 18px', md: '20px 22px' },
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={visible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 + idx * 0.25 }}
              style={{ width: '100%' }}
            >
              <Typography
                sx={{
                  fontFamily: SERIF,
                  fontWeight: s.isLeak ? 500 : 400,
                  fontSize: { xs: '1.9rem', sm: '2.2rem', md: idx === 2 ? '2.4rem' : '3.2rem' },
                  color: s.ink,
                  lineHeight: 1,
                  letterSpacing: '-0.03em',
                  whiteSpace: 'nowrap',
                }}
              >
                {s.count}
              </Typography>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: { xs: 10, md: 11 },
                  color: s.sub,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  mt: 1.2,
                  fontWeight: s.isLeak ? 600 : 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {s.label}
              </Typography>
            </motion.div>
          </Box>
        ))}
      </Box>

      <Reveal delay={1.3}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: { xs: 3, md: 4 } }}>
          {[
            {
              k: 'Momentum', kc: C.inkMid, border: C.hairline,
              body: 'Serious occupiers who close because they were always going to.',
              note: 'no system needed — and no credit deserved', nc: C.inkDim,
            },
            {
              k: 'Follow-through', kc: C.red, border: C.red,
              body: 'Went quiet · terms drifted · the right person never called back at the right moment.',
              note: 'the gap between an LOI and an agreement — operational, not fate', nc: C.red,
            },
            {
              k: 'Noise', kc: C.inkMid, border: C.hairline,
              body: 'Curiosity, courtesy, comparison shopping.',
              note: 'unrecoverable — they were never yours to lose', nc: C.inkDim,
            },
          ].map((col, idx) => (
            <Box key={idx} sx={{ borderTop: `2px solid ${col.border}`, pt: 2.5 }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10, color: col.kc, letterSpacing: '0.22em', mb: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
                {col.k}
              </Typography>
              <Typography sx={{ fontFamily: SANS, fontSize: { xs: 14, md: 15 }, color: C.ink, lineHeight: 1.55, mb: 1 }}>
                {col.body}
              </Typography>
              <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: col.nc }}>
                {col.note}
              </Typography>
            </Box>
          ))}
        </Box>
      </Reveal>
    </Box>
  );
};

const StakesSection = () => (
  <Section alt id="stakes">
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Reveal>
        <Kicker>Chapter 01 · The gap between an LOI and an agreement</Kicker>
        <Display sx={{ mb: { xs: 3, md: 4 } }}>
          Not every letter of intent becomes a registry.
        </Display>
        <Body lg dim sx={{ maxWidth: 740, mb: { xs: 7, md: 10 } }}>
          Across Indian commercial projects, a meaningful share of signed intent quietly
          dissolves between the LOI and the agreement — not because the occupier changed
          their mind, but because nobody was tracking the moment they started to.
        </Body>
      </Reveal>

      <Reveal delay={0.1}>
        <InViewWrap>{(visible) => <StakesBar visible={visible} />}</InViewWrap>
      </Reveal>

      <Reveal delay={0.3}>
        <Panel
          sx={{
            mt: { xs: 8, md: 12 },
            p: { xs: 4, md: 7 },
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
            gap: { xs: 4, md: 8 },
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.red, letterSpacing: '0.26em', textTransform: 'uppercase', fontWeight: 600, mb: 2.5 }}>
              What follow-through is worth
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, md: 1.5 }, mb: 3, flexWrap: 'wrap' }}>
              <Typography
                sx={{
                  fontFamily: SERIF,
                  fontWeight: 300,
                  fontSize: { xs: '3rem', sm: '4.5rem', md: '6.5rem', lg: '8rem' },
                  lineHeight: 0.9,
                  letterSpacing: '-0.05em',
                  color: C.red,
                }}
              >
                ₹40–60
              </Typography>
              <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, fontSize: { xs: '1.1rem', sm: '1.5rem', md: '2.2rem' }, color: C.red, mt: { xs: 1, md: 2.5 } }}>
                Cr
              </Typography>
            </Box>
            <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.inkMid, letterSpacing: '0.04em', borderLeft: `2px solid ${C.red}`, pl: 2.5, py: 0.5 }}>
              15–20 units × ₹2–3 Cr average ticket · at one project
            </Typography>
          </Box>
          <Typography
            sx={{
              fontFamily: SERIF,
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: { xs: '1.35rem', md: '1.9rem' },
              lineHeight: 1.4,
              color: C.ink,
            }}
          >
            CyberCity will be judged by how it converts and delivers — not by how it launched.
          </Typography>
        </Panel>
      </Reveal>
    </Box>
  </Section>
);

// ─── Two funnels, one problem ──────────────────────────────────────
const TwoFunnels = () => {
  const cols = [
    {
      kicker: 'Funnel one · Occupiers',
      title: '90 units. 70 LOIs. Dozens of live negotiations.',
      rows: [
        'Site visits and price discussions scattered across WhatsApp threads',
        'Terms agreed verbally, remembered differently by each side',
        'No one screen showing which LOIs are warm, cooling, or gone quiet',
      ],
    },
    {
      kicker: 'Funnel two · Co-investors',
      title: 'Thousands of co-owners, from ₹10,000 up.',
      rows: [
        'Every investor asking the same question: what is my money doing?',
        'Quarterly updates assembled by hand, sent into silence',
        'Trust — the entire brand — resting on how well you answer',
      ],
    },
  ];

  return (
    <Section id="funnels">
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Reveal>
          <Kicker>Chapter 02 · Two funnels, one problem</Kicker>
          <Display sx={{ mb: { xs: 6, md: 10 }, maxWidth: 1100 }}>
            MicroMitti runs two businesses at once. Both live in the same place: <Box component="span" sx={{ fontStyle: 'italic', color: C.gold }}>scattered.</Box>
          </Display>
        </Reveal>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 3, md: 4 } }}>
          {cols.map((col, idx) => (
            <Reveal key={idx} delay={idx * 0.12}>
              <Panel sx={{ p: { xs: 4, md: 6 }, height: '100%' }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.gold, letterSpacing: '0.22em', mb: 2.5, textTransform: 'uppercase', fontWeight: 600 }}>
                  {col.kicker}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: SERIF,
                    fontWeight: 400,
                    fontSize: { xs: '1.4rem', md: '1.8rem' },
                    lineHeight: 1.2,
                    color: C.ink,
                    mb: 3,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {col.title}
                </Typography>
                {col.rows.map((r, ridx) => (
                  <Box key={ridx} sx={{ display: 'flex', gap: 2, py: 1.6, borderTop: `1px solid ${C.hairline}`, alignItems: 'flex-start' }}>
                    <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', color: C.gold, fontSize: '1rem', mt: 0.1 }}>—</Typography>
                    <Typography sx={{ fontFamily: SANS, fontSize: { xs: 14, md: 15 }, color: C.inkMid, lineHeight: 1.6 }}>
                      {r}
                    </Typography>
                  </Box>
                ))}
              </Panel>
            </Reveal>
          ))}
        </Box>
      </Box>
    </Section>
  );
};

// ─── What the platform does — click-to-explore ─────────────────────
const CAPABILITIES = [
  {
    n: '01',
    short: 'LOI pipeline',
    title: 'Every LOI, tracked to its agreement.',
    desc: 'Each occupier scored by seriousness. Every conversation, site visit, and term logged. When an LOI starts cooling, the system says so — before the occupier says nothing.',
    outcome: 'The ₹40–60 Cr follow-through gap, closed by process instead of memory.',
  },
  {
    n: '02',
    short: 'Live inventory',
    title: 'Live inventory across every project.',
    desc: 'CyberCity, The Selene, Madhuvan — every unit\'s status, price, and holder on one screen, down to an interactive floor-by-floor view. What is available, blocked, committed, sold.',
    outcome: 'No double-commitments. No stale Excel. Instant answers.',
  },
  {
    n: '03',
    short: 'Collections',
    title: 'Collections that run themselves.',
    desc: 'Milestone-based payment schedules per unit, automatic demand tracking, due-today and overdue queues that update without anyone compiling them.',
    outcome: 'Cash flow visible daily across 90 units — not reconstructed at month-end.',
  },
  {
    n: '04',
    short: 'Broker network',
    title: 'Your broker network, on rails.',
    desc: 'Indore\'s brokers get their own professional portal — registering buyers, watching their pipeline, seeing commissions compute transparently from your rules.',
    outcome: 'The developer brokers prefer to work with, and zero commission disputes.',
  },
  {
    n: '05',
    short: 'Investor reporting',
    title: 'Investor reporting worthy of the trust.',
    desc: 'Branded, board-grade reports that generate on schedule — construction progress, collections, milestones — delivered through secure links, with open-tracking on every send.',
    outcome: 'Thousands of co-investors answered before they ask. That is the brand.',
  },
  {
    n: '06',
    short: 'Leadership view',
    title: 'Leadership on one screen.',
    desc: 'Every project, every funnel, every number — comparable side by side, drillable to the source record. Targets, variances, and red flags surface themselves.',
    outcome: 'The Series A data room becomes a login.',
  },
];

const Capabilities = () => {
  const [active, setActive] = useState(0);
  const card = CAPABILITIES[active];

  return (
    <Section alt id="platform">
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Reveal>
          <Kicker>Chapter 03 · What the platform does</Kicker>
          <Display sx={{ mb: { xs: 3, md: 4 }, maxWidth: 1000 }}>
            Six things, across both funnels.
          </Display>
          <Body lg dim sx={{ maxWidth: 700, mb: { xs: 6, md: 9 } }}>
            Tap through them — each one maps to a piece of MicroMitti's day.
          </Body>
        </Reveal>

        <Reveal delay={0.1}>
          {/* Desktop: master–detail. Mobile: the list opens inline. */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '340px 1fr' }, gap: { xs: 2, md: 4 }, alignItems: 'start' }}>
            {/* Selector list */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {CAPABILITIES.map((c, idx) => (
                <Box
                  key={idx}
                  onClick={() => setActive(idx)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    px: 2.5,
                    py: 1.8,
                    borderRadius: 2,
                    cursor: 'pointer',
                    background: active === idx ? C.panel : 'transparent',
                    border: `1px solid ${active === idx ? C.hairlineStrong : 'transparent'}`,
                    boxShadow: active === idx ? '0 2px 10px rgba(33,29,22,0.06)' : 'none',
                    transition: 'all 0.25s',
                    '&:hover': { background: active === idx ? C.panel : 'rgba(255,255,255,0.55)' },
                  }}
                >
                  <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: '1.05rem', color: active === idx ? C.gold : C.inkDim, minWidth: 26 }}>
                    {c.n}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: SANS,
                      fontSize: 15,
                      fontWeight: active === idx ? 600 : 400,
                      color: active === idx ? C.ink : C.inkMid,
                    }}
                  >
                    {c.short}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Detail panel */}
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <Panel sx={{ p: { xs: 4, md: 6 }, minHeight: { md: 340 }, display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, fontSize: '1.5rem', color: C.gold, mb: 2 }}>
                    {card.n}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: SERIF,
                      fontWeight: 400,
                      fontSize: { xs: '1.5rem', md: '2.1rem' },
                      lineHeight: 1.15,
                      color: C.ink,
                      mb: 2.5,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Body dim sx={{ mb: 4, flexGrow: 1, maxWidth: 640 }}>{card.desc}</Body>
                  <Box sx={{ pt: 3, borderTop: `1px solid ${C.hairline}` }}>
                    <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.inkDim, letterSpacing: '0.22em', mb: 1, textTransform: 'uppercase' }}>
                      What that changes
                    </Typography>
                    <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: { xs: 15.5, md: 17.5 }, color: C.gold, lineHeight: 1.5 }}>
                      {card.outcome}
                    </Typography>
                  </Box>
                </Panel>
              </motion.div>
            </AnimatePresence>
          </Box>
        </Reveal>
      </Box>
    </Section>
  );
};

// ─── The AI — interactive Q&A ──────────────────────────────────────
const AI_QA = [
  {
    q: 'Which CyberCity LOIs have gone quiet?',
    headline: '4 LOIs are cooling.',
    rows: [
      { k: 'Meridian GCC Services', v: '18 days silent · 7th floor · 5,200 sq ft' },
      { k: 'Sparrow Fintech', v: '15 days silent · token pending' },
      { k: 'Awadh Consulting', v: '12 days silent · awaiting revised terms' },
      { k: 'Trikon Studios', v: '11 days silent · follow-up never scheduled' },
    ],
    footer: 'Each name links to its full history — every visit, call, and commitment.',
  },
  {
    q: 'How did Selene collections move this month?',
    headline: '₹6.1 Cr collected · 96% of demanded.',
    rows: [
      { k: 'Demanded this month', v: '₹6.4 Cr across 11th-floor milestone' },
      { k: 'Collected', v: '₹6.1 Cr · 4 payments pending' },
      { k: 'Follow-ups live', v: '4 · assigned, with reminder dates' },
    ],
    footer: 'Numbers computed from the ledger at the moment you asked.',
  },
  {
    q: 'Which broker brought the most serious occupiers?',
    headline: 'Shree Balaji Realty leads this quarter.',
    rows: [
      { k: 'Shree Balaji Realty', v: '9 registrations · 3 LOIs · avg seriousness 74' },
      { k: 'Nexus Estates', v: '11 registrations · 2 LOIs · avg seriousness 58' },
      { k: 'Vertex Partners', v: '5 registrations · 2 LOIs · avg seriousness 71' },
    ],
    footer: 'Commission positions for each — computed, transparent, dispute-free.',
  },
  {
    q: 'Show me every unit above the 7th floor still unsold.',
    headline: '14 units · ₹38.2 Cr of inventory.',
    rows: [
      { k: 'Floors 8–10', v: '9 offices · 2 under LOI · 7 available' },
      { k: 'Floors 11–12', v: '5 offices · premium corner stock intact' },
      { k: 'Pricing position', v: '2 units flagged below market percentile' },
    ],
    footer: 'One more question drills into any unit\'s cost sheet.',
  },
];

const AISection = () => {
  const [activeQ, setActiveQ] = useState(0);
  const qa = AI_QA[activeQ];

  const rows = [
    {
      label: 'Ask-anything copilot',
      desc: 'A conversational layer over live business data — inventory, pipeline, collections, commissions, team. It answers with real numbers and charts, drawn from the system at the moment you ask.',
    },
    {
      label: 'Report agent',
      desc: 'Tell it what the quarter\'s investor report should cover; it assembles the report conversationally — structure from the conversation, every figure computed by the platform.',
    },
    {
      label: 'Occupier & lead intelligence',
      desc: 'Researches serious prospects from public sources before the first call. Reads every logged conversation for sentiment, buying signals, and the right next step.',
    },
    {
      label: 'Market research desk',
      desc: 'Continuously studies competing supply from public listings and RERA data, keeps a living competitor picture, and grounds pricing decisions in it.',
    },
  ];

  return (
    <Section id="ai">
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Reveal>
          <Kicker>Chapter 04 · The AI, specifically</Kicker>
          <Display sx={{ mb: { xs: 3, md: 4 }, maxWidth: 1100 }}>
            Not a chatbot on the side. A layer through everything.
          </Display>
          <Body lg dim sx={{ maxWidth: 740, mb: { xs: 6, md: 9 } }}>
            You have built AI products — so this section skips the adjectives. Try the
            questions below; the answers are the shape of what your team would see.
          </Body>
        </Reveal>

        {/* Interactive Q&A */}
        <Reveal delay={0.1}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
            {AI_QA.map((item, idx) => (
              <Box
                key={idx}
                onClick={() => setActiveQ(idx)}
                sx={{
                  fontFamily: SANS,
                  fontSize: { xs: 13, md: 14 },
                  fontWeight: activeQ === idx ? 600 : 400,
                  color: activeQ === idx ? C.panel : C.ink,
                  background: activeQ === idx ? C.gold : C.panel,
                  border: `1px solid ${activeQ === idx ? C.gold : C.hairlineStrong}`,
                  borderRadius: 6,
                  px: 2.2,
                  py: 1.1,
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  '&:hover': { borderColor: C.gold, color: activeQ === idx ? C.panel : C.gold },
                }}
              >
                “{item.q}”
              </Box>
            ))}
          </Box>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeQ}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <Panel sx={{ p: { xs: 3.5, md: 5 }, mb: { xs: 7, md: 10 }, maxWidth: 900 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.green, letterSpacing: '0.22em', mb: 2, textTransform: 'uppercase', fontWeight: 600 }}>
                  Answered from live records · illustrative
                </Typography>
                <Typography sx={{ fontFamily: SERIF, fontWeight: 400, fontSize: { xs: '1.5rem', md: '2rem' }, color: C.ink, mb: 3, letterSpacing: '-0.01em' }}>
                  {qa.headline}
                </Typography>
                {qa.rows.map((row, ridx) => (
                  <Box
                    key={ridx}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '220px 1fr' },
                      gap: { xs: 0.3, sm: 3 },
                      py: 1.6,
                      borderTop: `1px solid ${C.hairline}`,
                    }}
                  >
                    <Typography sx={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: C.ink }}>{row.k}</Typography>
                    <Typography sx={{ fontFamily: SANS, fontSize: 14, color: C.inkMid }}>{row.v}</Typography>
                  </Box>
                ))}
                <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14.5, color: C.inkMid, mt: 2.5 }}>
                  {qa.footer}
                </Typography>
              </Panel>
            </motion.div>
          </AnimatePresence>
        </Reveal>

        {/* Capability rows */}
        <Box sx={{ mb: { xs: 6, md: 9 } }}>
          {rows.map((row, idx) => (
            <Reveal key={idx} delay={idx * 0.05}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
                  gap: { xs: 1, md: 6 },
                  py: { xs: 2.5, md: 3.5 },
                  borderBottom: `1px solid ${C.hairline}`,
                }}
              >
                <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.gold, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, pt: 0.4 }}>
                  {row.label}
                </Typography>
                <Body dim sx={{ maxWidth: 760 }}>{row.desc}</Body>
              </Box>
            </Reveal>
          ))}
        </Box>

        {/* The grounding architecture */}
        <Reveal delay={0.1}>
          <Panel sx={{ p: { xs: 4, md: 6 }, borderLeft: `3px solid ${C.gold}`, maxWidth: 940 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.gold, letterSpacing: '0.22em', mb: 2, textTransform: 'uppercase', fontWeight: 600 }}>
              The part you will care about most
            </Typography>
            <Typography sx={{ fontFamily: SERIF, fontWeight: 300, fontSize: { xs: '1.3rem', md: '1.8rem' }, lineHeight: 1.4, color: C.ink, mb: 2 }}>
              The AI is architected so it cannot invent a number.
            </Typography>
            <Body dim sx={{ maxWidth: 760 }}>
              Every figure it speaks is computed by the platform from the underlying
              records — the model composes structure and language, never data. Output
              that cannot be grounded in a real record is rejected before it renders.
              When it writes an investor report, the investor is reading your ledger,
              not a language model's confidence.
            </Body>
          </Panel>
        </Reveal>
      </Box>
    </Section>
  );
};

// ─── Product mockups ───────────────────────────────────────────────
const InventoryMockup = () => (
  <MockupShell url="propvantage.ai / inventory / cybercity">
    <Typography sx={{ fontFamily: SERIF, fontWeight: 400, fontSize: { xs: '1.5rem', md: '2.1rem' }, color: C.ink, mb: 3.5, lineHeight: 1.2, letterSpacing: '-0.01em' }}>
      CyberCity · <Box component="span" sx={{ color: C.gold }}>77 offices</Box> + <Box component="span" sx={{ color: C.gold }}>13 retail</Box> · live status
    </Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 0, border: `1px solid ${C.hairline}`, borderRadius: 2, overflow: 'hidden', mb: 3.5 }}>
      {[
        { label: 'Available', value: '34', sub: '1.7L sq ft' },
        { label: 'LOI held', value: '31', sub: 'follow-through live' },
        { label: 'Agreement', value: '19', sub: '₹47.5 Cr booked' },
        { label: 'Blocked', value: '6', sub: 'pending decision' },
      ].map((row, idx) => (
        <Box
          key={idx}
          sx={{
            p: 2.5,
            background: idx === 1 ? C.goldSoft : C.panel,
            borderRight: { xs: idx % 2 === 0 ? `1px solid ${C.hairline}` : 'none', md: idx < 3 ? `1px solid ${C.hairline}` : 'none' },
            borderBottom: { xs: idx < 2 ? `1px solid ${C.hairline}` : 'none', md: 'none' },
          }}
        >
          <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.inkMid, letterSpacing: '0.14em', mb: 1, textTransform: 'uppercase' }}>
            {row.label}
          </Typography>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 400, fontSize: '2rem', color: idx === 1 ? C.gold : C.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {row.value}
          </Typography>
          <Typography sx={{ fontFamily: SANS, fontSize: 12, color: C.inkMid, mt: 0.8 }}>{row.sub}</Typography>
        </Box>
      ))}
    </Box>
    <Box sx={{ borderLeft: `3px solid ${C.green}`, pl: 2.5, py: 0.5 }}>
      <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.green, letterSpacing: '0.18em', mb: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>
        One source of truth
      </Typography>
      <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '1.15rem', md: '1.4rem' }, color: C.ink, fontWeight: 400 }}>
        Every unit's status, price, and holder — the same answer for everyone who asks.
      </Typography>
    </Box>
  </MockupShell>
);

const LOIPipelineMockup = () => (
  <MockupShell url="propvantage.ai / pipeline / cybercity-lois">
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 260px' }, gap: 4 }}>
      <Box>
        <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.inkMid, letterSpacing: '0.18em', mb: 1.2, textTransform: 'uppercase' }}>
          Occupier · LOI #CC-07-04 · CyberCity Tower A
        </Typography>
        <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '1.8rem', md: '2.4rem' }, color: C.ink, fontWeight: 400, mb: 0.8, letterSpacing: '-0.02em' }}>
          Meridian GCC Services
        </Typography>
        <Typography sx={{ fontFamily: SANS, fontSize: 13.5, color: C.inkMid, mb: 3 }}>
          7th floor · 5,200 sq ft · LOI signed 26 May
        </Typography>
        <Box>
          {[
            { label: 'Commitment', value: 'LOI signed · token discussed', detail: 'Fit-out timeline shared with their architect', color: C.green },
            { label: 'Engagement', value: '6 interactions in 45 days', detail: 'Two site visits, one with US leadership on call', color: C.green },
            { label: 'Momentum', value: 'Quiet for 18 days', detail: 'Last contact 21 Jul · follow-up was never scheduled', color: C.red },
            { label: 'Next step', value: 'Escalated to Sales Head', detail: 'Auto-assigned today · agreement draft attached', color: C.gold },
          ].map((row, idx) => (
            <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: { xs: '110px 1fr', md: '140px 1fr' }, gap: 2.5, py: 1.8, borderTop: `1px solid ${C.hairline}` }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.inkDim, letterSpacing: '0.12em', textTransform: 'uppercase', pt: 0.3 }}>
                {row.label}
              </Typography>
              <Box>
                <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '1rem', md: '1.1rem' }, color: row.color, fontWeight: 500 }}>
                  {row.value}
                </Typography>
                <Typography sx={{ fontFamily: SANS, fontSize: 12.5, color: C.inkMid, mt: 0.2 }}>
                  {row.detail}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ background: C.soft, p: 3.5, borderRadius: 2, border: `1px solid ${C.hairline}`, textAlign: 'center', alignSelf: 'start' }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.inkMid, letterSpacing: '0.18em', mb: 2.5, textTransform: 'uppercase' }}>
          Seriousness
        </Typography>
        <Box sx={{ position: 'relative', width: 150, height: 150, mx: 'auto', mb: 2 }}>
          <svg viewBox="0 0 100 100" style={{ width: '100%', transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="44" fill="none" stroke={C.hairline} strokeWidth="4" />
            <motion.circle
              cx="50" cy="50" r="44" fill="none" stroke={C.gold} strokeWidth="4"
              strokeDasharray="276"
              strokeLinecap="round"
              initial={{ strokeDashoffset: 276 }}
              animate={{ strokeDashoffset: 276 - (276 * 0.82) }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontFamily: SERIF, fontSize: '3.2rem', fontWeight: 300, color: C.ink, lineHeight: 1, letterSpacing: '-0.04em' }}>
              82
            </Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.inkDim, letterSpacing: '0.2em' }}>/ 100</Typography>
          </Box>
        </Box>
        <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.red, letterSpacing: '0.18em', textTransform: 'uppercase', mb: 1.5, fontWeight: 600 }}>
          Cooling · act now
        </Typography>
        <Typography sx={{ fontFamily: SANS, fontSize: 12.5, color: C.inkMid, lineHeight: 1.5 }}>
          High seriousness, fading momentum —<br />the exact deal follow-through saves.
        </Typography>
      </Box>
    </Box>
  </MockupShell>
);

const InvestorReportMockup = () => (
  <MockupShell url="propvantage.ai / reports / selene-q2-fy27">
    <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.gold, letterSpacing: '0.18em', mb: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
      Investor report · The Selene · Q2 FY27
    </Typography>
    <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '1.5rem', md: '2.1rem' }, color: C.ink, fontWeight: 400, mb: 3.5, letterSpacing: '-0.01em' }}>
      Generated on schedule. Delivered to 260 co-investors. Read by 214.
    </Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 0, border: `1px solid ${C.hairline}`, borderRadius: 2, overflow: 'hidden', mb: 3.5 }}>
      {[
        { label: 'Construction progress', value: '64%', sub: 'structure to 11th floor · on plan' },
        { label: 'Collections this quarter', value: '₹18.4 Cr', sub: '96% of demanded · 4 follow-ups live' },
        { label: 'Open rate', value: '82%', sub: '214 of 260 · tracked per send' },
      ].map((row, idx) => (
        <Box
          key={idx}
          sx={{
            p: 2.5,
            background: idx === 2 ? C.goldSoft : C.panel,
            borderRight: { xs: 'none', md: idx < 2 ? `1px solid ${C.hairline}` : 'none' },
            borderBottom: { xs: idx < 2 ? `1px solid ${C.hairline}` : 'none', md: 'none' },
          }}
        >
          <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.inkMid, letterSpacing: '0.14em', mb: 1, textTransform: 'uppercase' }}>
            {row.label}
          </Typography>
          <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '1.4rem', md: '1.7rem' }, color: idx === 2 ? C.gold : C.ink, fontWeight: 400, letterSpacing: '-0.02em' }}>
            {row.value}
          </Typography>
          <Typography sx={{ fontFamily: SANS, fontSize: 12.5, color: C.inkMid, mt: 0.5 }}>{row.sub}</Typography>
        </Box>
      ))}
    </Box>
    <Box sx={{ borderLeft: `3px solid ${C.gold}`, pl: 2.5, py: 0.5 }}>
      <Typography sx={{ fontFamily: MONO, fontSize: 10.5, color: C.gold, letterSpacing: '0.18em', mb: 0.8, textTransform: 'uppercase', fontWeight: 600 }}>
        Secure by default
      </Typography>
      <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '1.15rem', md: '1.4rem' }, color: C.ink, fontWeight: 400 }}>
        Each investor opens a personal, OTP-protected link — no PDF forwarding chains, and you see exactly who has read what.
      </Typography>
    </Box>
  </MockupShell>
);

const ProductMockups = () => {
  const [active, setActive] = useState(0);
  const mockups = [
    { tab: 'Live inventory', content: <InventoryMockup /> },
    { tab: 'LOI pipeline', content: <LOIPipelineMockup /> },
    { tab: 'Investor reports', content: <InvestorReportMockup /> },
  ];

  return (
    <Section alt id="screens">
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Reveal>
          <Kicker>Chapter 05 · What the system shows you</Kicker>
          <Display sx={{ mb: { xs: 5, md: 8 }, maxWidth: 1100 }}>
            Three screens from MicroMitti's world.
          </Display>
        </Reveal>

        <Reveal>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 4, flexWrap: 'wrap' }}>
            {mockups.map((m, idx) => (
              <Box
                key={idx}
                onClick={() => setActive(idx)}
                sx={{
                  px: 2.4,
                  py: 1.1,
                  cursor: 'pointer',
                  fontFamily: SANS,
                  fontSize: { xs: 13, md: 14 },
                  fontWeight: active === idx ? 600 : 400,
                  borderRadius: 6,
                  color: active === idx ? C.panel : C.ink,
                  background: active === idx ? C.ink : C.panel,
                  border: `1px solid ${active === idx ? C.ink : C.hairlineStrong}`,
                  transition: 'all 0.25s',
                  '&:hover': { borderColor: C.ink },
                }}
              >
                {m.tab}
              </Box>
            ))}
          </Box>
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {mockups[active].content}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Section>
  );
};

// ─── The math, interactive — pure value, no cost line ──────────────
const ConversionSlider = () => {
  const [saved, setSaved] = useState(5);
  const avgTicket = 2.5; // ₹ Cr
  const value = saved * avgTicket;

  return (
    <Section id="math">
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Reveal>
          <Kicker>Chapter 06 · The math, interactive</Kicker>
          <Display sx={{ mb: 3, maxWidth: 1100 }}>
            What is follow-through worth at CyberCity?
          </Display>
          <Body lg dim sx={{ maxWidth: 720, mb: { xs: 6, md: 9 } }}>
            Of the ~18 LOIs that typically slip between intent and agreement, drag to
            see what converting even a few of them protects.
          </Body>
        </Reveal>

        <Reveal delay={0.1}>
          <Panel
            sx={{
              p: { xs: 4, md: 7 },
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1px 1fr' },
              gap: { xs: 5, lg: 8 },
            }}
          >
            <Box>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkMid, letterSpacing: '0.2em', mb: 1.5, textTransform: 'uppercase' }}>
                LOIs recovered by follow-through
              </Typography>
              <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '3.6rem', md: '5.2rem' }, fontWeight: 300, color: C.gold, lineHeight: 1, letterSpacing: '-0.04em', mb: 1 }}>
                {saved}
              </Typography>
              <Body dim sx={{ mb: 4 }}>of ~18 that would otherwise slip</Body>
              <Slider
                value={saved}
                onChange={(e, v) => setSaved(v)}
                min={1}
                max={18}
                sx={{
                  color: C.gold,
                  height: 3,
                  '& .MuiSlider-thumb': {
                    width: 22,
                    height: 22,
                    background: C.gold,
                    border: `3px solid ${C.panel}`,
                    boxShadow: '0 1px 6px rgba(33,29,22,0.25)',
                    '&:hover, &.Mui-active': { boxShadow: `0 0 0 10px rgba(143, 111, 47, 0.14)` },
                  },
                  '& .MuiSlider-rail': { background: C.hairlineStrong, opacity: 1, height: 3 },
                  '& .MuiSlider-track': { background: C.gold, border: 'none', height: 3 },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkDim }}>1</Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkDim }}>18</Typography>
              </Box>
            </Box>

            <Box sx={{ display: { xs: 'none', lg: 'block' }, background: C.hairline, height: '100%' }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.green, letterSpacing: '0.2em', mb: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
                Deal value protected
              </Typography>
              <motion.div
                key={value}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
                  <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '3.6rem', md: '5.2rem' }, fontWeight: 300, color: C.ink, lineHeight: 1, letterSpacing: '-0.04em' }}>
                    ₹{value.toFixed(1)}
                  </Typography>
                  <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: { xs: '1.4rem', md: '2rem' }, color: C.gold, fontWeight: 300 }}>
                    Cr
                  </Typography>
                </Box>
              </motion.div>
              <Body dim>
                at a ₹2.5 Cr average ticket · one project · before The Selene, Madhuvan,
                and everything after
              </Body>
            </Box>
          </Panel>
        </Reveal>
      </Box>
    </Section>
  );
};

// ─── A week at MicroMitti — timeline ───────────────────────────────
const WeekSection = () => {
  const days = [
    {
      when: 'Monday · 9:05 AM',
      title: 'The leadership question answers itself.',
      desc: '"Which CyberCity LOIs have gone quiet?" — asked in plain English, answered in seconds with four names, days-silent counts, and the last conversation on each. No analyst, no Excel export, no Friday.',
    },
    {
      when: 'Wednesday · 2:40 PM',
      title: 'An escalation fires before an occupier goes cold.',
      desc: 'Meridian GCC has been silent 18 days against a signed LOI. The system escalates to the Sales Head with the full history attached — the call happens that afternoon, not next month.',
    },
    {
      when: 'Quarter-end',
      title: '260 investor reports send themselves.',
      desc: 'The Selene\'s quarterly report generates on schedule — progress, collections, milestones — and goes out through secure personal links. By Monday you know 82% of investors have read it. Zero analyst-hours spent.',
    },
  ];

  return (
    <Section alt id="week">
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Reveal>
          <Kicker>Chapter 07 · A week at MicroMitti, on the platform</Kicker>
          <Display sx={{ mb: { xs: 6, md: 10 }, maxWidth: 1000 }}>
            Your body of work, running through it.
          </Display>
        </Reveal>

        <Box sx={{ position: 'relative', pl: { xs: 3.5, md: 5 } }}>
          {/* Timeline spine */}
          <Box sx={{ position: 'absolute', left: { xs: 7, md: 9 }, top: 10, bottom: 10, width: '2px', background: C.hairlineStrong }} />
          {days.map((d, idx) => (
            <Reveal key={idx} delay={idx * 0.08}>
              <Box sx={{ position: 'relative', pb: idx < days.length - 1 ? { xs: 5, md: 7 } : 0 }}>
                {/* Dot */}
                <Box
                  sx={{
                    position: 'absolute',
                    left: { xs: -34, md: -46 },
                    top: 6,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: C.gold,
                    border: `3px solid ${C.soft}`,
                    boxShadow: `0 0 0 2px ${C.gold}`,
                  }}
                />
                <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.gold, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, mb: 1 }}>
                  {d.when}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: SERIF,
                    fontWeight: 400,
                    fontSize: { xs: '1.4rem', md: '1.9rem' },
                    lineHeight: 1.2,
                    color: C.ink,
                    mb: 1.5,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {d.title}
                </Typography>
                <Body dim sx={{ maxWidth: 760 }}>{d.desc}</Body>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Box>
    </Section>
  );
};

// ─── Closing — builder to builder ──────────────────────────────────
const Closing = () => (
  <Section id="note" sx={{ py: { xs: 14, md: 20 } }}>
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Reveal>
        <Kicker>Chapter 08 · Builder to builder</Kicker>
        <Display sx={{ mb: 5, fontSize: { xs: '2rem', sm: '2.8rem', md: '3.8rem', lg: '4.4rem' }, lineHeight: 1.08 }}>
          You could build this. <Box component="span" sx={{ color: C.gold }}>You've built harder things.</Box>
        </Display>
        <Typography
          sx={{
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: { xs: '1.25rem', md: '1.75rem' },
            color: C.inkMid,
            maxWidth: 940,
            lineHeight: 1.55,
          }}
        >
          What can't be rebuilt in eight months is the part that isn't code — years of
          workflows shaped by how Indian developers actually sell, collect, and settle
          brokers; AI that has been taught what it is not allowed to say; and the boring
          twenty percent — approval chains, commission reconciliation, report governance —
          that every v1 discovers last. It exists so your engineers can stay on what only
          MicroMitti can build.
        </Typography>
      </Reveal>
    </Box>
  </Section>
);

// ─── Footer ────────────────────────────────────────────────────────
const Footer = () => (
  <Box
    sx={{
      background: C.paper,
      color: C.inkDim,
      py: 4.5,
      px: { xs: 4, sm: 7, md: 12 },
      borderTop: `1px solid ${C.hairline}`,
      fontFamily: MONO,
      fontSize: 11,
      letterSpacing: '0.18em',
      textAlign: 'center',
      textTransform: 'uppercase',
    }}
  >
    PropVantage AI · Built for Indian real estate · Prepared for MicroMitti · {new Date().getFullYear()}
  </Box>
);

// ─── Login link ───────────────────────────────────────────────────
const LoginLink = () => (
  <Box
    sx={{
      position: 'fixed',
      bottom: { xs: 20, md: 28 },
      right: { xs: 20, md: 32 },
      zIndex: 100,
    }}
  >
    <Box
      component="a"
      href="/login"
      sx={{
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: C.inkMid,
        textDecoration: 'none',
        py: 1.2,
        px: 2.5,
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${C.hairlineStrong}`,
        borderRadius: 6,
        transition: 'all 0.25s',
        '&:hover': { color: C.gold, borderColor: C.gold },
      }}
    >
      Login
    </Box>
  </Box>
);

// ─── Scroll progress ──────────────────────────────────────────────
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const width = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: C.gold,
        transformOrigin: '0%',
        zIndex: 300,
        width,
      }}
    />
  );
};

// ─── Page ──────────────────────────────────────────────────────────
const MicroMittiPitchPage = () => {
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = C.paper;

    // Load Google Fonts (Spectral, Inter Tight, JetBrains Mono)
    const fontsLink = document.createElement('link');
    fontsLink.rel = 'stylesheet';
    fontsLink.href =
      'https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,200;0,300;0,400;0,500;1,300;1,400&family=Inter+Tight:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap';
    document.head.appendChild(fontsLink);

    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);

    const title = document.title;
    document.title = 'PropVantage AI · for MicroMitti';

    return () => {
      document.body.style.backgroundColor = prevBg;
      document.head.removeChild(meta);
      document.head.removeChild(fontsLink);
      document.title = title;
    };
  }, []);

  return (
    <Box sx={{ background: C.paper, fontFamily: SANS, color: C.ink, position: 'relative' }}>
      <ScrollProgress />
      <ChapterNav />
      <LoginLink />
      <Hero />
      <StakesSection />
      <TwoFunnels />
      <Capabilities />
      <AISection />
      <ProductMockups />
      <ConversionSlider />
      <WeekSection />
      <Closing />
      <Footer />
    </Box>
  );
};

export default MicroMittiPitchPage;

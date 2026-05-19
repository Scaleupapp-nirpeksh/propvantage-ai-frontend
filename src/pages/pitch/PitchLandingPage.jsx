// File: src/pages/pitch/PitchLandingPage.jsx
// Description: HubTown / 25 South pitch landing.
// Editorial design: one serif family (Spectral) for everything except the
// monospace data labels. No emojis. No decorative icons. No glowy gradients.
// Real data presented as data.

import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Slider } from '@mui/material';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';

// ─── Tokens ────────────────────────────────────────────────────────
const C = {
  bg: '#0B0B0C',
  bgPanel: '#131316',
  bgSoft: '#18181C',
  ink: '#EBE5D8',          // warm off-white
  inkBright: '#F7F2E6',
  inkMid: '#8E867A',
  inkDim: '#5C564E',
  hairline: 'rgba(235, 229, 216, 0.08)',
  hairlineStrong: 'rgba(235, 229, 216, 0.18)',
  gold: '#B89456',          // muted antique brass — not yellow gold
  goldDim: '#7E6638',
  red: '#B0463B',
  green: '#5A8C6B',
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
const Section = ({ children, sx = {}, alt = false, ...rest }) => (
  <Box
    component="section"
    sx={{
      backgroundColor: alt ? C.bgSoft : C.bg,
      color: C.ink,
      px: { xs: 4, sm: 7, md: 12, lg: 18 },
      py: { xs: 12, md: 20 },
      position: 'relative',
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
      fontWeight: 400,
      letterSpacing: '0.28em',
      textTransform: 'uppercase',
      color: C.inkMid,
      mb: { xs: 5, md: 7 },
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
      fontSize: { xs: '2.4rem', sm: '3.2rem', md: '4.6rem', lg: '5.4rem' },
      lineHeight: 1.02,
      letterSpacing: '-0.02em',
      color: C.inkBright,
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
      fontSize: lg ? { xs: '1.1rem', md: '1.3rem' } : { xs: '1rem', md: '1.1rem' },
      lineHeight: 1.65,
      fontWeight: 300,
      color: dim ? C.inkMid : C.ink,
      ...sx,
    }}
  >
    {children}
  </Typography>
);

// ─── Hero ──────────────────────────────────────────────────────────
const Hero = () => {
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 250);
    return () => clearTimeout(t);
  }, []);
  const v = useCountUp(1000, 2000, started);

  return (
    <Section
      sx={{
        minHeight: '100vh',
        pt: { xs: 14, md: 20 },
        pb: { xs: 12, md: 16 },
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%' }}>
        {/* The number */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: started ? 1 : 0 }}
          transition={{ duration: 1.2 }}
          style={{ marginBottom: 48 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, md: 2 } }}>
            <Box
              sx={{
                fontFamily: SERIF,
                fontWeight: 300,
                fontSize: { xs: '5rem', sm: '8rem', md: '13rem', lg: '16rem' },
                lineHeight: 0.85,
                letterSpacing: '-0.05em',
                color: C.inkBright,
              }}
            >
              ₹{Math.round(v).toLocaleString('en-IN')}
            </Box>
            <Box
              sx={{
                fontFamily: SERIF,
                fontWeight: 300,
                fontSize: { xs: '1.5rem', sm: '2.5rem', md: '4rem', lg: '4.5rem' },
                lineHeight: 1,
                color: C.gold,
                fontStyle: 'italic',
                mt: { xs: 2, md: 5 },
              }}
            >
              Cr
            </Box>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.5 }}
        >
          <Display as="h1" sx={{ mb: 5, maxWidth: 1100 }}>
            That's what <Box component="span" sx={{ fontStyle: 'italic', color: C.gold }}>25 South</Box> is leaving on the table every month.
          </Display>
          <Body lg dim sx={{ maxWidth: 720 }}>
            Not because the market is soft. Because the operations are leaky —
            and right now, nobody can see exactly where.
          </Body>
        </motion.div>
      </Box>
    </Section>
  );
};

// ─── The breakdown — horizontal stacked bar ─────────────────────────
//
// Of 100 enquiries per month at 25 South, three things happen:
//   60–70 lost to buyer reasons   (~65% of the bar — muted)
//   20–30 lost to operational     (~25% of the bar — RED)
//   10 booked                      (~10% of the bar — gold)
//
// The bar itself carries the count and label inside each segment.
// Below the bar, supporting callouts tied to each segment by alignment + color.
// The ₹1,000+ Cr punchline lives in a separate climactic block below.
//
const StackedBar = ({ visible }) => {
  const segments = [
    {
      flex: 65,
      bg: '#3A3530',
      ink: C.ink,
      sub: C.inkMid,
      count: '60–70',
      label: 'Lost · Buyer reasons',
    },
    {
      flex: 25,
      bg: C.red,
      ink: '#FBEFE9',
      sub: '#F2D4CC',
      count: '20–30',
      label: 'Lost · Operational',
      isLeak: true,
    },
    {
      flex: 10,
      bg: C.gold,
      ink: '#1A0F03',
      sub: '#3D2A0E',
      count: '10',
      label: 'Booked',
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* The bar */}
      <Box
        sx={{
          display: 'flex',
          gap: '4px',
          height: { xs: 110, md: 170 },
          mb: 2,
        }}
      >
        {segments.map((s, idx) => (
          <motion.div
            key={idx}
            initial={{ scaleX: 0, transformOrigin: 'left center' }}
            animate={visible ? { scaleX: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.15 + idx * 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              flex: s.flex,
              background: s.bg,
              display: 'flex',
              alignItems: 'flex-end',
              padding: '20px 22px',
              overflow: 'hidden',
              position: 'relative',
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
                  fontSize: { xs: '1.8rem', md: idx === 2 ? '2.4rem' : '3.4rem' },
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
                  fontSize: { xs: 9, md: 11 },
                  color: s.sub,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  mt: 1.2,
                  fontWeight: s.isLeak ? 600 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {s.label}
              </Typography>
            </motion.div>
          </motion.div>
        ))}
      </Box>

      {/* Percentage row aligned to bar */}
      <Box sx={{ display: 'flex', gap: '4px', mb: { xs: 7, md: 10 } }}>
        {segments.map((s, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={visible ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.9 + idx * 0.25 }}
            style={{ flex: s.flex, paddingLeft: 22 }}
          >
            <Typography
              sx={{
                fontFamily: MONO,
                fontSize: 11,
                color: idx === 1 ? C.red : idx === 2 ? C.gold : C.inkMid,
                letterSpacing: '0.18em',
                fontWeight: idx === 1 ? 600 : 400,
              }}
            >
              {s.flex}%
            </Typography>
          </motion.div>
        ))}
      </Box>

      {/* Supporting context rows */}
      <Reveal delay={1.6}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: { xs: 4, md: 6 } }}>
          <Box sx={{ borderTop: `1px solid ${C.hairline}`, pt: 3 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.inkMid, letterSpacing: '0.22em', mb: 1.5, textTransform: 'uppercase' }}>
              Buyer reasons
            </Typography>
            <Typography sx={{ fontFamily: SANS, fontSize: { xs: 14, md: 15 }, color: C.ink, lineHeight: 1.55, fontWeight: 300, mb: 1 }}>
              Vastu, brand preference, personal choice.
            </Typography>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: C.inkDim, fontWeight: 300 }}>
              unrecoverable — they were never our deal to lose
            </Typography>
          </Box>

          <Box sx={{ borderTop: `2px solid ${C.red}`, pt: 3 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.red, letterSpacing: '0.22em', mb: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
              Operational reasons
            </Typography>
            <Typography sx={{ fontFamily: SANS, fontSize: { xs: 14, md: 15 }, color: C.ink, lineHeight: 1.55, fontWeight: 300, mb: 1 }}>
              Missed follow-ups · scattered documents · the right information not at the right place.
            </Typography>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: C.red, fontWeight: 400 }}>
              the leak — every one of these was a deal we could have had
            </Typography>
          </Box>

          <Box sx={{ borderTop: `1px solid ${C.gold}`, pt: 3 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.gold, letterSpacing: '0.22em', mb: 1.5, textTransform: 'uppercase' }}>
              Booked
            </Typography>
            <Typography sx={{ fontFamily: SANS, fontSize: { xs: 14, md: 15 }, color: C.ink, lineHeight: 1.55, fontWeight: 300, mb: 1 }}>
              10 confirmed bookings.
            </Typography>
            <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, color: C.gold, fontWeight: 400 }}>
              ₹500 Cr captured
            </Typography>
          </Box>
        </Box>
      </Reveal>
    </Box>
  );
};

const FunnelSection = () => {
  return (
    <Section alt>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Reveal>
          <Kicker>The math behind ₹1,000 crore</Kicker>
          <Display sx={{ mb: { xs: 3, md: 4 } }}>
            Of 100 enquiries each month at 25 South, only 10 close.
          </Display>
          <Body lg dim sx={{ maxWidth: 720, mb: { xs: 8, md: 12 } }}>
            The 90 that don't aren't all genuinely lost. Most of them are. But 20–30 of them are not — they're lost because nothing in the operation was tracking them.
          </Body>
        </Reveal>

        <Reveal delay={0.1}>
          <InViewWrap>
            {(visible) => <StackedBar visible={visible} />}
          </InViewWrap>
        </Reveal>

        {/* The climactic ₹1,000 Cr punchline below the bar */}
        <Reveal delay={0.3}>
          <Box
            sx={{
              mt: { xs: 10, md: 16 },
              pt: { xs: 8, md: 10 },
              borderTop: `1px solid ${C.hairline}`,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
              gap: { xs: 5, md: 10 },
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: 11,
                  color: C.red,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  mb: 3,
                }}
              >
                Operational opportunity loss
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 4 }}>
                <Typography
                  sx={{
                    fontFamily: SERIF,
                    fontWeight: 300,
                    fontSize: { xs: '5rem', sm: '7rem', md: '10rem', lg: '12rem' },
                    lineHeight: 0.9,
                    letterSpacing: '-0.05em',
                    color: C.red,
                  }}
                >
                  ₹1,000+
                </Typography>
                <Typography
                  sx={{
                    fontFamily: SERIF,
                    fontStyle: 'italic',
                    fontWeight: 300,
                    fontSize: { xs: '1.4rem', md: '3rem' },
                    color: C.red,
                    mt: { xs: 2, md: 5 },
                  }}
                >
                  Cr
                </Typography>
              </Box>
              <Typography
                sx={{
                  fontFamily: MONO,
                  fontSize: 12,
                  color: C.inkMid,
                  letterSpacing: '0.04em',
                  borderLeft: `1px solid ${C.red}`,
                  pl: 2.5,
                  py: 0.5,
                }}
              >
                20–30 leads × ₹50 Cr avg ticket &nbsp;·&nbsp; every month, at one project
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontFamily: SERIF,
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: { xs: '1.4rem', md: '2.2rem' },
                  lineHeight: 1.35,
                  color: C.inkBright,
                  mb: 3,
                }}
              >
                A thousand crore. Every month. Not lost to the market — lost to how the operation runs.
              </Typography>
              <Body dim sx={{ maxWidth: 480 }}>
                These aren't deals that the buyer walked away from. They're deals where the team didn't get back on time, the documents weren't where they should be, the right person didn't see the right note.
              </Body>
            </Box>
          </Box>
        </Reveal>
      </Box>
    </Section>
  );
};

// ─── Why this is happening — pure typography ───────────────────────
const WhyThisHappens = () => {
  const items = [
    { n: '01', label: 'Excel',            desc: 'unit inventory and pricing' },
    { n: '02', label: 'WhatsApp groups',  desc: 'buyer follow-ups and team coordination' },
    { n: '03', label: 'Paper notes',      desc: 'site visit feedback' },
    { n: '04', label: 'Scattered drives', desc: 'cost sheets, brochures, agreements' },
    { n: '05', label: 'Personal memory',  desc: 'who promised what to whom' },
  ];
  return (
    <Section>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Reveal>
          <Kicker>Why this is happening</Kicker>
          <Display sx={{ mb: { xs: 8, md: 12 }, maxWidth: 1100 }}>
            Today, the entire lead journey lives in <Box component="span" sx={{ fontStyle: 'italic', color: C.gold }}>five different places.</Box>
          </Display>
        </Reveal>

        {/* Horizontal 5-column layout — each "place" stands alone, separated by hairlines */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
            borderTop: `1px solid ${C.hairline}`,
            borderBottom: `1px solid ${C.hairline}`,
          }}
        >
          {items.map((item, idx) => (
            <Reveal key={idx} delay={idx * 0.1}>
              <Box
                sx={{
                  py: { xs: 5, md: 7 },
                  px: { xs: 2.5, md: 3.5 },
                  borderRight: {
                    xs: idx % 2 === 0 ? `1px solid ${C.hairline}` : 'none',
                    sm: (idx + 1) % 3 !== 0 ? `1px solid ${C.hairline}` : 'none',
                    md: idx < items.length - 1 ? `1px solid ${C.hairline}` : 'none',
                  },
                  borderBottom: {
                    xs: idx < items.length - 2 ? `1px solid ${C.hairline}` : 'none',
                    md: 'none',
                  },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: SERIF,
                    fontStyle: 'italic',
                    fontWeight: 300,
                    fontSize: { xs: '1.2rem', md: '1.5rem' },
                    color: C.gold,
                    mb: { xs: 3, md: 4 },
                  }}
                >
                  {item.n}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: SERIF,
                    fontWeight: 400,
                    fontSize: { xs: '1.3rem', md: '1.7rem', lg: '1.9rem' },
                    color: C.inkBright,
                    lineHeight: 1.1,
                    mb: 2,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.label}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: SANS,
                    fontSize: { xs: 13, md: 14 },
                    color: C.inkMid,
                    fontWeight: 300,
                    lineHeight: 1.5,
                  }}
                >
                  {item.desc}
                </Typography>
              </Box>
            </Reveal>
          ))}
        </Box>

        <Reveal delay={0.4}>
          <Box sx={{ mt: { xs: 8, md: 12 }, maxWidth: 1000 }}>
            <Typography
              sx={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: { xs: '1.4rem', md: '2.2rem' },
                lineHeight: 1.3,
                color: C.inkBright,
                mb: 3,
              }}
            >
              There is no single screen anywhere in the company that shows the lead journey from enquiry to handover.
            </Typography>
            <Body dim sx={{ maxWidth: 760 }}>
              When a deal slips, nobody can answer <em>when</em> the last follow-up was, <em>who</em> promised what at the site visit, <em>why</em> the buyer went cold. The ₹50 crore walks out the door and the answer is "we don't know".
            </Body>
          </Box>
        </Reveal>
      </Box>
    </Section>
  );
};

// ─── Four things ───────────────────────────────────────────────────
const FourThings = () => {
  const cards = [
    {
      n: '01',
      title: 'Track every lead from first call to final cheque.',
      desc: 'Every interaction logged. Every commitment recorded. Every follow-up scheduled. When a lead goes cold, you know exactly when, why, and who dropped the ball.',
      metricLabel: 'Recovery potential',
      metric: '₹300–500 Cr',
      metricSub: 'per month — half of operationally-lost leads at 25 South',
    },
    {
      n: '02',
      title: 'Spot underpricing automatically.',
      desc: 'Daily comparison against every active luxury project in BKC, Worli, and Bandra West. The system flags units priced below their market percentile, with the recommended adjustment.',
      metricLabel: 'Pricing intelligence',
      metric: 'Live, daily',
      metricSub: 'against real competitor data — no manual research',
    },
    {
      n: '03',
      title: 'Catch overdue payments on day 1, not day 90.',
      desc: 'The CFO sees every installment about to age before it does. Collections gets the call list automatically. The cash-flow leak closes before it becomes a problem.',
      metricLabel: 'Collections acceleration',
      metric: '₹40–80 Cr',
      metricSub: 'per project — aged receivables recovery typical for ultra-luxury',
    },
    {
      n: '04',
      title: 'Give leadership one screen.',
      desc: 'Every project, every team, every number — on one page. Click any cell to drill into the source data. No more "I\'ll have the CFO send you the file Friday."',
      metricLabel: 'Decision speed',
      metric: 'Minutes',
      metricSub: 'not Monday meetings',
    },
  ];

  return (
    <Section alt>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Reveal>
          <Kicker>Four things. Tied to money.</Kicker>
          <Display sx={{ mb: { xs: 8, md: 12 }, maxWidth: 1000 }}>
            What PropVantage does for HubTown.
          </Display>
        </Reveal>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 0, md: 0 } }}>
          {cards.map((card, idx) => (
            <Reveal key={idx} delay={idx * 0.08}>
              <Box
                sx={{
                  p: { xs: 5, md: 7 },
                  borderRight: { xs: 'none', md: idx % 2 === 0 ? `1px solid ${C.hairline}` : 'none' },
                  borderBottom: { xs: `1px solid ${C.hairline}`, md: idx < 2 ? `1px solid ${C.hairline}` : 'none' },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: SERIF,
                    fontStyle: 'italic',
                    fontWeight: 300,
                    fontSize: { xs: '1.4rem', md: '1.8rem' },
                    color: C.gold,
                    mb: 3,
                  }}
                >
                  {card.n}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: SERIF,
                    fontWeight: 400,
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    lineHeight: 1.15,
                    color: C.inkBright,
                    mb: 3,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {card.title}
                </Typography>
                <Body dim sx={{ mb: 5, flexGrow: 1 }}>{card.desc}</Body>
                <Box sx={{ pt: 4, borderTop: `1px solid ${C.hairline}` }}>
                  <Typography
                    sx={{
                      fontFamily: MONO,
                      fontSize: 11,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: C.inkMid,
                      mb: 1.5,
                    }}
                  >
                    {card.metricLabel}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: SERIF,
                      fontWeight: 300,
                      fontSize: { xs: '2.2rem', md: '2.8rem' },
                      lineHeight: 1,
                      letterSpacing: '-0.02em',
                      color: C.gold,
                      mb: 1,
                    }}
                  >
                    {card.metric}
                  </Typography>
                  <Typography sx={{ fontFamily: SANS, fontSize: 13, color: C.inkMid, fontWeight: 300 }}>
                    {card.metricSub}
                  </Typography>
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Box>
    </Section>
  );
};

// ─── Product mockups (no fake AI-confidence stamp) ─────────────────
const PricingMockup = () => (
  <Box
    sx={{
      background: C.bgPanel,
      borderRadius: 12,
      border: `1px solid ${C.hairline}`,
      overflow: 'hidden',
      maxWidth: 1100,
    }}
  >
    <Box sx={{ background: C.bgSoft, px: 3, py: 1.8, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${C.hairline}` }}>
      <Box sx={{ display: 'flex', gap: 0.7 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
      </Box>
      <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, ml: 2 }}>
        propvantage.ai / competitive / marquis-sea-face
      </Typography>
    </Box>
    <Box sx={{ p: { xs: 4, md: 6 } }}>
      <Typography
        sx={{
          fontFamily: SERIF,
          fontWeight: 400,
          fontSize: { xs: '1.6rem', md: '2.4rem' },
          color: C.inkBright,
          mb: 4,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        }}
      >
        Marquis Sea Face is underpriced by{' '}
        <Box component="span" sx={{ color: C.red, fontStyle: 'italic' }}>₹6,000–10,000 per sqft</Box>. You sit at the{' '}
        <Box component="span" sx={{ color: C.red, fontStyle: 'italic' }}>35th percentile</Box> against Lodha Sea Face and Oberoi 360 West.
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 0,
          border: `1px solid ${C.hairline}`,
          mb: 4,
        }}
      >
        {[
          { label: '4BHK XL',    current: '88,000', recommended: '94,000', delta: '+6.8%' },
          { label: '5BHK',       current: '95,000', recommended: '98,000', delta: '+3.2%' },
          { label: 'Penthouse', current: '110,000', recommended: '118,000', delta: '+7.3%' },
        ].map((row, idx) => (
          <Box
            key={idx}
            sx={{
              p: 3,
              borderRight: { xs: 'none', md: idx < 2 ? `1px solid ${C.hairline}` : 'none' },
              borderBottom: { xs: idx < 2 ? `1px solid ${C.hairline}` : 'none', md: 'none' },
            }}
          >
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, letterSpacing: '0.15em', mb: 1.5, textTransform: 'uppercase' }}>
              {row.label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography sx={{ fontFamily: SERIF, fontSize: '1.2rem', color: C.inkDim, textDecoration: 'line-through', fontWeight: 300 }}>
                ₹{row.current}
              </Typography>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 400, fontSize: '2rem', color: C.gold, letterSpacing: '-0.02em' }}>
                ₹{row.recommended}
              </Typography>
            </Box>
            <Typography sx={{ fontFamily: MONO, fontSize: 12, color: C.green }}>{row.delta} per sqft</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ borderLeft: `2px solid ${C.green}`, pl: 3, py: 1 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.green, letterSpacing: '0.2em', mb: 1, textTransform: 'uppercase' }}>
          Estimated impact
        </Typography>
        <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '1.4rem', md: '1.8rem' }, color: C.inkBright, fontWeight: 400 }}>
          +₹110–160 Cr revenue uplift on remaining inventory
        </Typography>
      </Box>
    </Box>
  </Box>
);

const LeadMockup = () => (
  <Box
    sx={{
      background: C.bgPanel,
      borderRadius: 12,
      border: `1px solid ${C.hairline}`,
      overflow: 'hidden',
      maxWidth: 1100,
    }}
  >
    <Box sx={{ background: C.bgSoft, px: 3, py: 1.8, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${C.hairline}` }}>
      <Box sx={{ display: 'flex', gap: 0.7 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
      </Box>
      <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, ml: 2 }}>
        propvantage.ai / leads / sanya-bhansali
      </Typography>
    </Box>
    <Box sx={{ p: { xs: 4, md: 6 } }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 280px' }, gap: 5 }}>
        <Box>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkMid, letterSpacing: '0.2em', mb: 1.5, textTransform: 'uppercase' }}>
            Lead · #L4471 · Marquis Sea Face
          </Typography>
          <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '2rem', md: '2.8rem' }, color: C.inkBright, fontWeight: 400, mb: 1, letterSpacing: '-0.02em' }}>
            Sanya Bhansali
          </Typography>
          <Typography sx={{ fontFamily: SANS, fontSize: 14, color: C.inkMid, mb: 4 }}>
            +91 99999-XXXXX · Property Portal · Last contact 24 days ago
          </Typography>
          <Box>
            {[
              { label: 'Budget aligned',  value: '98%',                       detail: '₹49–69 Cr stated · ₹58 Cr mid-price',          color: C.green },
              { label: 'Engagement',      value: '8 interactions in 60 days', detail: 'Site visits with spouse + interior designer',  color: C.green },
              { label: 'Timeline',        value: 'Immediate',                 detail: 'Stated close within Q3',                       color: C.green },
              { label: 'Source quality',  value: 'Property Portal',           detail: 'Below average — but engagement overrides',     color: C.inkMid },
            ].map((row, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '170px 1fr',
                  gap: 3,
                  py: 2,
                  borderBottom: `1px solid ${C.hairline}`,
                }}
              >
                <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  {row.label}
                </Typography>
                <Box>
                  <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '1rem', md: '1.15rem' }, color: row.color, fontWeight: 400 }}>
                    {row.value}
                  </Typography>
                  <Typography sx={{ fontFamily: SANS, fontSize: 12, color: C.inkMid, mt: 0.3 }}>
                    {row.detail}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ background: C.bg, p: 4, border: `1px solid ${C.hairline}`, textAlign: 'center' }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, letterSpacing: '0.2em', mb: 3, textTransform: 'uppercase' }}>
            Score
          </Typography>
          <Box sx={{ position: 'relative', width: 170, height: 170, mx: 'auto', mb: 2 }}>
            <svg viewBox="0 0 100 100" style={{ width: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="44" fill="none" stroke={C.hairline} strokeWidth="3" />
              <motion.circle
                cx="50" cy="50" r="44" fill="none" stroke={C.green} strokeWidth="3"
                strokeDasharray="276"
                strokeLinecap="round"
                initial={{ strokeDashoffset: 276 }}
                animate={{ strokeDashoffset: 276 - (276 * 0.86) }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontFamily: SERIF, fontSize: '3.8rem', fontWeight: 300, color: C.inkBright, lineHeight: 1, letterSpacing: '-0.04em' }}>
                86
              </Typography>
              <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.inkDim, letterSpacing: '0.2em' }}>/ 100</Typography>
            </Box>
          </Box>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.red, letterSpacing: '0.2em', textTransform: 'uppercase', mb: 2 }}>
            Critical priority
          </Typography>
          <Typography sx={{ fontFamily: SANS, fontSize: 13, color: C.inkMid, lineHeight: 1.5 }}>
            Site Visit Scheduled<br />Sales Exec: Priya Mehta
          </Typography>
        </Box>
      </Box>
    </Box>
  </Box>
);

const CashflowMockup = () => (
  <Box
    sx={{
      background: C.bgPanel,
      borderRadius: 12,
      border: `1px solid ${C.hairline}`,
      overflow: 'hidden',
      maxWidth: 1100,
    }}
  >
    <Box sx={{ background: C.bgSoft, px: 3, py: 1.8, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${C.hairline}` }}>
      <Box sx={{ display: 'flex', gap: 0.7 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
      </Box>
      <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, ml: 2 }}>
        propvantage.ai / leadership / cash-flow
      </Typography>
    </Box>
    <Box sx={{ p: { xs: 4, md: 6 } }}>
      <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.red, letterSpacing: '0.2em', mb: 2, textTransform: 'uppercase' }}>
        Collections alert · Tier 1
      </Typography>
      <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '1.7rem', md: '2.4rem' }, color: C.inkBright, fontWeight: 400, mb: 5, letterSpacing: '-0.01em' }}>
        ₹61 Cr overdue at Marquis Sea Face.
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 0, border: `1px solid ${C.hairline}`, mb: 5 }}>
        {[
          { label: 'Project',                 value: 'Marquis Sea Face',     sub: 'Worli · 52 units · 21 sold' },
          { label: 'Overdue installments',    value: '5',                    sub: '47% of older installments aging' },
          { label: 'Recoverable in 90 days', value: '₹85–110 Cr',           sub: 'estimated, Tier-1 protocol' },
        ].map((row, idx) => (
          <Box
            key={idx}
            sx={{
              p: 3,
              borderRight: { xs: 'none', md: idx < 2 ? `1px solid ${C.hairline}` : 'none' },
              borderBottom: { xs: idx < 2 ? `1px solid ${C.hairline}` : 'none', md: 'none' },
            }}
          >
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, letterSpacing: '0.15em', mb: 1.5, textTransform: 'uppercase' }}>
              {row.label}
            </Typography>
            <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '1.5rem', md: '1.9rem' }, color: C.inkBright, fontWeight: 400, letterSpacing: '-0.02em' }}>
              {row.value}
            </Typography>
            <Typography sx={{ fontFamily: SANS, fontSize: 13, color: C.inkMid, mt: 0.5 }}>{row.sub}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ border: `1px solid ${C.hairline}` }}>
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${C.hairline}`, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 2 }}>
          {['Buyer', 'Amount', 'Days overdue', 'Last contact'].map((h) => (
            <Typography key={h} sx={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{h}</Typography>
          ))}
        </Box>
        {[
          { name: 'Rohan Hinduja · MQ-N-3501', amt: '₹14.2 Cr', days: '94', last: '32d ago' },
          { name: 'Meera Wadia · MQ-N-2801',   amt: '₹12.8 Cr', days: '78', last: '21d ago' },
          { name: 'Vivek Kothari · MQ-S-501',  amt: '₹18.6 Cr', days: '61', last: '18d ago' },
        ].map((row, idx) => (
          <Box key={idx} sx={{ p: 2.5, borderBottom: idx < 2 ? `1px solid ${C.hairline}` : 'none', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 2 }}>
            <Typography sx={{ fontFamily: SANS, fontSize: 14, color: C.ink }}>{row.name}</Typography>
            <Typography sx={{ fontFamily: SERIF, fontSize: 16, color: C.gold, fontWeight: 400 }}>{row.amt}</Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: 13, color: C.red }}>{row.days}</Typography>
            <Typography sx={{ fontFamily: SANS, fontSize: 14, color: C.inkMid }}>{row.last}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);

const ProductMockups = () => {
  const [active, setActive] = useState(0);
  const mockups = [
    { tab: 'Pricing intelligence', content: <PricingMockup /> },
    { tab: 'Lead scoring',         content: <LeadMockup /> },
    { tab: 'Cash flow alerts',     content: <CashflowMockup /> },
  ];

  return (
    <Section>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Reveal>
          <Kicker>What the system shows you</Kicker>
          <Display sx={{ mb: { xs: 6, md: 10 }, maxWidth: 1100 }}>
            Three things your team sees on Monday morning.
          </Display>
        </Reveal>

        <Reveal>
          <Box sx={{ display: 'flex', gap: 0, mb: 6, borderBottom: `1px solid ${C.hairline}` }}>
            {mockups.map((m, idx) => (
              <Box
                key={idx}
                onClick={() => setActive(idx)}
                sx={{
                  px: { xs: 2, md: 3 },
                  py: 2,
                  cursor: 'pointer',
                  fontFamily: MONO,
                  fontSize: { xs: 11, md: 12 },
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  fontWeight: 400,
                  color: active === idx ? C.gold : C.inkMid,
                  borderBottom: `2px solid ${active === idx ? C.gold : 'transparent'}`,
                  marginBottom: '-1px',
                  transition: 'color 0.25s, border-color 0.25s',
                  '&:hover': { color: C.ink },
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

// ─── ROI Calculator ────────────────────────────────────────────────
const ROICalculator = () => {
  const [recovery, setRecovery] = useState(5);
  const monthlyLeak = 1000;
  const monthlyRecovered = (monthlyLeak * recovery) / 100;
  const annualRecovered = monthlyRecovered * 12;
  const platformCost = 0.86;
  const roiX = Math.round(annualRecovered / platformCost);

  return (
    <Section alt>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Reveal>
          <Kicker>The math, interactive</Kicker>
          <Display sx={{ mb: 3, maxWidth: 1100 }}>
            What does recovery look like?
          </Display>
          <Body lg dim sx={{ maxWidth: 720, mb: { xs: 8, md: 12 } }}>
            Drag the slider. Watch what recovering even a small fraction of the operational leak does for your bottom line.
          </Body>
        </Reveal>

        <Reveal delay={0.1}>
          <Box
            sx={{
              border: `1px solid ${C.hairline}`,
              p: { xs: 4, md: 8 },
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1px 1fr' },
              gap: { xs: 6, lg: 10 },
            }}
          >
            <Box>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkMid, letterSpacing: '0.22em', mb: 2, textTransform: 'uppercase' }}>
                Recovery assumption
              </Typography>
              <Typography
                sx={{
                  fontFamily: SERIF,
                  fontSize: { xs: '4rem', md: '6rem' },
                  fontWeight: 300,
                  color: C.gold,
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  mb: 1,
                }}
              >
                {recovery}%
              </Typography>
              <Body dim sx={{ mb: 5 }}>of operationally-lost leads recovered</Body>
              <Slider
                value={recovery}
                onChange={(e, v) => setRecovery(v)}
                min={1}
                max={30}
                sx={{
                  color: C.gold,
                  height: 2,
                  '& .MuiSlider-thumb': {
                    width: 20,
                    height: 20,
                    background: C.gold,
                    border: `2px solid ${C.bg}`,
                    boxShadow: 'none',
                    '&:hover, &.Mui-active': { boxShadow: `0 0 0 12px rgba(184, 148, 86, 0.12)` },
                  },
                  '& .MuiSlider-rail': { background: C.hairline, opacity: 1, height: 2 },
                  '& .MuiSlider-track': { background: C.gold, border: 'none', height: 2 },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, letterSpacing: '0.1em' }}>1%</Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkDim, letterSpacing: '0.1em' }}>30%</Typography>
              </Box>
            </Box>

            <Box sx={{ display: { xs: 'none', lg: 'block' }, background: C.hairline, height: '100%' }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.green, letterSpacing: '0.22em', mb: 2, textTransform: 'uppercase' }}>
                Annual recovery
              </Typography>
              <motion.div
                key={annualRecovered}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1 }}>
                  <Typography
                    sx={{
                      fontFamily: SERIF,
                      fontSize: { xs: '4rem', md: '6rem' },
                      fontWeight: 300,
                      color: C.inkBright,
                      lineHeight: 1,
                      letterSpacing: '-0.04em',
                    }}
                  >
                    ₹{annualRecovered.toFixed(0)}
                  </Typography>
                  <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: { xs: '1.5rem', md: '2.4rem' }, color: C.gold, fontWeight: 300 }}>
                    Cr
                  </Typography>
                </Box>
              </motion.div>
              <Body dim sx={{ mb: 5 }}>₹{monthlyRecovered.toFixed(0)} Cr per month recovered</Body>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, pt: 4, borderTop: `1px solid ${C.hairline}` }}>
                <Box>
                  <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.inkDim, letterSpacing: '0.2em', mb: 1, textTransform: 'uppercase' }}>
                    Platform cost
                  </Typography>
                  <Typography sx={{ fontFamily: SERIF, fontSize: '1.6rem', fontWeight: 400, color: C.ink, letterSpacing: '-0.02em' }}>
                    ₹0.86 Cr<Box component="span" sx={{ fontFamily: SANS, fontSize: 12, color: C.inkMid, ml: 1, fontWeight: 300 }}>/ year</Box>
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: MONO, fontSize: 10, color: C.inkDim, letterSpacing: '0.2em', mb: 1, textTransform: 'uppercase' }}>
                    Return
                  </Typography>
                  <Typography sx={{ fontFamily: SERIF, fontSize: '1.6rem', fontWeight: 400, color: C.gold, letterSpacing: '-0.02em' }}>
                    {roiX}<Box component="span" sx={{ fontFamily: SANS, fontSize: 12, color: C.inkMid, ml: 1, fontWeight: 300 }}>× cost</Box>
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Reveal>
      </Box>
    </Section>
  );
};

// ─── Comparison ────────────────────────────────────────────────────
const Comparison = () => {
  const cols = [
    {
      name: 'Excel + WhatsApp',
      tag: 'What HubTown uses today',
      cost: '₹0 + ₹1,000 Cr opportunity lost',
      points: [
        { good: false, text: 'No single source of truth' },
        { good: false, text: 'Manual follow-ups, easy to miss' },
        { good: false, text: 'Zero market intelligence' },
        { good: false, text: 'No accountability trail' },
      ],
    },
    {
      name: 'NetSuite',
      tag: 'Generic ERP',
      cost: '₹70–150 lakh / year',
      points: [
        { good: true,  text: 'Strong financials + accounting' },
        { good: false, text: 'Not built for real estate workflows' },
        { good: false, text: 'No competitive intelligence or AI' },
        { good: false, text: 'Consultant army to customize · 6–12 months' },
      ],
    },
    {
      name: 'PropVantage',
      tag: 'Built for HubTown',
      cost: '₹86 lakh / year',
      points: [
        { good: true, text: 'Real estate end-to-end · enquiry to handover' },
        { good: true, text: 'Competitive analysis · lead scoring · pricing' },
        { good: true, text: 'Live in days · no consultants' },
        { good: true, text: 'Every future integration · included' },
      ],
      featured: true,
    },
  ];

  return (
    <Section>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <Reveal>
          <Kicker>The honest comparison</Kicker>
          <Display sx={{ mb: { xs: 8, md: 12 }, maxWidth: 1100 }}>
            What you use today versus what's possible.
          </Display>
        </Reveal>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 0, border: `1px solid ${C.hairline}` }}>
          {cols.map((col, idx) => (
            <Reveal key={idx} delay={idx * 0.1}>
              <Box
                sx={{
                  p: { xs: 5, md: 6 },
                  borderRight: { xs: 'none', md: idx < 2 ? `1px solid ${C.hairline}` : 'none' },
                  borderBottom: { xs: idx < 2 ? `1px solid ${C.hairline}` : 'none', md: 'none' },
                  background: col.featured ? `rgba(184, 148, 86, 0.04)` : 'transparent',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {col.featured && (
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: C.gold }} />
                )}
                <Typography sx={{ fontFamily: MONO, fontSize: 11, color: col.featured ? C.gold : C.inkMid, letterSpacing: '0.22em', mb: 2.5, textTransform: 'uppercase' }}>
                  {col.tag}
                </Typography>
                <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '1.6rem', md: '2rem' }, fontWeight: 400, color: C.inkBright, mb: 1, letterSpacing: '-0.02em' }}>
                  {col.name}
                </Typography>
                <Typography sx={{ fontFamily: SANS, fontSize: 14, color: col.featured ? C.gold : C.inkMid, mb: 5, fontWeight: 300 }}>
                  {col.cost}
                </Typography>
                <Box sx={{ flexGrow: 1 }}>
                  {col.points.map((p, pidx) => (
                    <Box key={pidx} sx={{ display: 'flex', gap: 2, py: 1.5, borderBottom: pidx < col.points.length - 1 ? `1px solid ${C.hairline}` : 'none', alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          mt: 1,
                          width: 16,
                          height: 1,
                          flexShrink: 0,
                          background: p.good ? C.green : C.inkDim,
                        }}
                      />
                      <Typography sx={{ fontFamily: SANS, fontSize: 14, color: p.good ? C.ink : C.inkMid, lineHeight: 1.55, fontWeight: 300 }}>
                        {p.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Reveal>
          ))}
        </Box>

        <Reveal delay={0.3}>
          <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: { xs: '1.3rem', md: '1.8rem' }, color: C.inkBright, lineHeight: 1.4, mt: { xs: 6, md: 8 }, maxWidth: 900, fontWeight: 300 }}>
            HubTown already pays NetSuite ₹70+ lakh a year for an ERP that doesn't understand real estate.
            <Box component="span" sx={{ color: C.gold }}> Roughly the same money — different product.</Box>
          </Typography>
        </Reveal>
      </Box>
    </Section>
  );
};

// ─── Pricing ───────────────────────────────────────────────────────
const Pricing = () => (
  <Section alt>
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Reveal>
        <Kicker>Founding Partner Pricing · for HubTown</Kicker>
        <Display sx={{ mb: { xs: 8, md: 12 }, maxWidth: 1100 }}>
          A single, transparent number.
        </Display>
      </Reveal>

      <Reveal delay={0.1}>
        <Box sx={{ border: `1px solid ${C.hairline}`, p: { xs: 5, md: 8 } }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 6, md: 0 }, pb: { xs: 5, md: 7 }, borderBottom: `1px solid ${C.hairline}` }}>
            <Box sx={{ pr: { xs: 0, md: 5 }, borderRight: { xs: 'none', md: `1px solid ${C.hairline}` } }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkMid, letterSpacing: '0.22em', mb: 3, textTransform: 'uppercase' }}>
                Base · up to 15 users
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1.5 }}>
                <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '4rem', md: '6rem' }, fontWeight: 300, color: C.inkBright, lineHeight: 1, letterSpacing: '-0.04em' }}>
                  ₹5L
                </Typography>
                <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, fontSize: '1.4rem', color: C.inkMid }}>
                  / month
                </Typography>
              </Box>
              <Body dim>Effective <Box component="span" sx={{ color: C.gold }}>₹33,333 per user</Box></Body>
            </Box>
            <Box sx={{ pl: { xs: 0, md: 5 } }}>
              <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkMid, letterSpacing: '0.22em', mb: 3, textTransform: 'uppercase' }}>
                Beyond 15 users
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 1.5 }}>
                <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '4rem', md: '6rem' }, fontWeight: 300, color: C.inkBright, lineHeight: 1, letterSpacing: '-0.04em' }}>
                  ₹20k
                </Typography>
                <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, fontSize: '1.4rem', color: C.inkMid }}>
                  / user / month
                </Typography>
              </Box>
              <Body dim><Box component="span" sx={{ color: C.green }}>40% lower</Box> than base rate</Body>
            </Box>
          </Box>

          <Box sx={{ py: { xs: 5, md: 6 }, borderBottom: `1px solid ${C.hairline}` }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkMid, letterSpacing: '0.22em', mb: 3, textTransform: 'uppercase' }}>
              One-time setup
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
              <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '2.4rem', md: '3.4rem' }, fontWeight: 300, color: C.inkBright, lineHeight: 1, letterSpacing: '-0.04em' }}>
                ₹2L
              </Typography>
              <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, fontSize: '1.1rem', color: C.inkMid }}>
                — implementation · data migration · team onboarding · included
              </Typography>
            </Box>
          </Box>

          <Box sx={{ pt: { xs: 5, md: 6 } }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: C.inkMid, letterSpacing: '0.22em', mb: 4, textTransform: 'uppercase' }}>
              Everything included
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, columnGap: 6, rowGap: 2 }}>
              {[
                'Full platform — leads, sales, payments, commissions, construction',
                'All AI — competitive analysis, lead scoring, pricing intelligence',
                'Implementation, data migration, ongoing support',
                'Every future integration · at the same price · forever',
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 2, py: 1, alignItems: 'flex-start' }}>
                  <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', color: C.gold, mt: 0.2, fontSize: '1rem' }}>—</Typography>
                  <Typography sx={{ fontFamily: SANS, fontSize: { xs: 14, md: 16 }, color: C.ink, lineHeight: 1.6, fontWeight: 300 }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Typography sx={{ fontFamily: SERIF, fontStyle: 'italic', fontWeight: 300, fontSize: '1.1rem', color: C.inkMid, mt: 5, maxWidth: 760, lineHeight: 1.6 }}>
          Founding Partner pricing is reserved for our first five customers. Lock in for 36 months and these numbers don't move — even as we ship new modules, integrations, and capabilities.
        </Typography>
      </Reveal>
    </Box>
  </Section>
);

// ─── Closing ───────────────────────────────────────────────────────
const Closing = () => (
  <Section sx={{ py: { xs: 16, md: 24 } }}>
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Reveal>
        <Display sx={{ mb: 6, fontSize: { xs: '2.2rem', sm: '3rem', md: '4.4rem', lg: '5.2rem' }, lineHeight: 1.05 }}>
          At <Box component="span" sx={{ color: C.gold }}>₹86 lakh a year</Box>, PropVantage pays for itself if it recovers <Box component="span" sx={{ fontStyle: 'italic' }}>one</Box> missed booking.
        </Display>
        <Typography
          sx={{
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: { xs: '1.4rem', md: '2rem' },
            color: C.inkMid,
            maxWidth: 900,
          }}
        >
          25 South loses <Box component="span" sx={{ color: C.red }}>20–30 of them</Box> every month.
        </Typography>
      </Reveal>
    </Box>
  </Section>
);

// ─── Footer ────────────────────────────────────────────────────────
const Footer = () => (
  <Box
    sx={{
      background: C.bg,
      color: C.inkDim,
      py: 5,
      px: { xs: 4, sm: 7, md: 12 },
      borderTop: `1px solid ${C.hairline}`,
      fontFamily: MONO,
      fontSize: 11,
      letterSpacing: '0.18em',
      textAlign: 'center',
      textTransform: 'uppercase',
    }}
  >
    PropVantage AI · Built for Indian real estate · Prepared for HubTown · {new Date().getFullYear()}
  </Box>
);

// ─── Login link ───────────────────────────────────────────────────
const LoginLink = () => (
  <Box
    sx={{
      position: 'fixed',
      top: { xs: 20, md: 28 },
      right: { xs: 24, md: 40 },
      zIndex: 100,
    }}
  >
    <Box
      component="a"
      href="/login"
      sx={{
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: 400,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: C.inkMid,
        textDecoration: 'none',
        py: 1.2,
        px: 2.5,
        background: 'rgba(11, 11, 12, 0.7)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${C.hairline}`,
        transition: 'all 0.25s',
        '&:hover': { color: C.gold, borderColor: C.goldDim },
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
        height: 1,
        background: C.gold,
        transformOrigin: '0%',
        zIndex: 200,
        width,
      }}
    />
  );
};

// ─── Page ──────────────────────────────────────────────────────────
const PitchLandingPage = () => {
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = C.bg;

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
    document.title = 'PropVantage AI · for HubTown';

    return () => {
      document.body.style.backgroundColor = prevBg;
      document.head.removeChild(meta);
      document.head.removeChild(fontsLink);
      document.title = title;
    };
  }, []);

  return (
    <Box sx={{ background: C.bg, fontFamily: SANS, color: C.ink, position: 'relative', overflow: 'hidden' }}>
      <ScrollProgress />
      <LoginLink />
      <Hero />
      <FunnelSection />
      <WhyThisHappens />
      <FourThings />
      <ProductMockups />
      <ROICalculator />
      <Comparison />
      <Pricing />
      <Closing />
      <Footer />
    </Box>
  );
};

export default PitchLandingPage;

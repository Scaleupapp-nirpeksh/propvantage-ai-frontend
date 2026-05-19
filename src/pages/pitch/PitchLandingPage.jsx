// File: src/pages/pitch/PitchLandingPage.jsx
// Description: Pitch landing page for HubTown / 25 South — public, no auth required.
// Route: /pitch/hubtown
// Self-contained editorial design (cream + charcoal + deep gold) — does NOT
// inherit the application's blue/gold theme so the look doesn't fight the
// premium feel the page is going for.

import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';

// ─── Design tokens (scoped to this page only) ──────────────────────
const C = {
  cream: '#FAF8F4',
  creamSoft: '#F2EEE5',
  charcoal: '#1A1A1A',
  charcoalSoft: '#2A2A2A',
  gold: '#8C6A2A',
  goldSoft: '#B89456',
  ink: '#2A2A2A',
  inkOnDark: '#F5F1E8',
  muted: '#6B6258',
  mutedOnDark: '#9C948A',
  divider: '#E5DFD2',
  red: '#C0392B',
  green: '#2A6F4D',
};

const SERIF = `'Playfair Display', 'Cormorant Garamond', Georgia, 'Times New Roman', serif`;
const SANS = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

// ─── Reusable bits ─────────────────────────────────────────────────
const Section = ({ dark = false, children, sx = {}, ...rest }) => (
  <Box
    component="section"
    sx={{
      backgroundColor: dark ? C.charcoal : C.cream,
      color: dark ? C.inkOnDark : C.ink,
      px: { xs: 3, sm: 6, md: 10, lg: 14 },
      py: { xs: 8, md: 12 },
      ...sx,
    }}
    {...rest}
  >
    {children}
  </Box>
);

const Kicker = ({ children, dark = false }) => (
  <Typography
    sx={{
      fontFamily: SANS,
      fontSize: { xs: 11, md: 12 },
      fontWeight: 600,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: dark ? C.goldSoft : C.gold,
      mb: { xs: 3, md: 4 },
    }}
  >
    {children}
  </Typography>
);

const H2 = ({ children, sx = {} }) => (
  <Typography
    component="h2"
    sx={{
      fontFamily: SERIF,
      fontWeight: 700,
      fontSize: { xs: '1.8rem', sm: '2.2rem', md: '3rem', lg: '3.4rem' },
      lineHeight: 1.1,
      letterSpacing: '-0.01em',
      ...sx,
    }}
  >
    {children}
  </Typography>
);

const BigNum = ({ children, sx = {}, animate = true, value }) => {
  // Optional count-up: pass numeric value + format function via children
  return (
    <Typography
      component="div"
      sx={{
        fontFamily: SERIF,
        fontWeight: 700,
        fontSize: { xs: '4.5rem', sm: '6rem', md: '8.5rem', lg: '10rem' },
        lineHeight: 0.95,
        letterSpacing: '-0.04em',
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
};

const Body = ({ children, sx = {}, dim = false, dark = false }) => (
  <Typography
    component="p"
    sx={{
      fontFamily: SANS,
      fontSize: { xs: '1rem', md: '1.15rem' },
      lineHeight: 1.7,
      fontWeight: 400,
      color: dim ? (dark ? C.mutedOnDark : C.muted) : 'inherit',
      ...sx,
    }}
  >
    {children}
  </Typography>
);

const Lead = ({ children, sx = {}, dark = false }) => (
  <Typography
    component="p"
    sx={{
      fontFamily: SERIF,
      fontStyle: 'italic',
      fontWeight: 400,
      fontSize: { xs: '1.2rem', md: '1.5rem', lg: '1.65rem' },
      lineHeight: 1.45,
      color: dark ? C.inkOnDark : C.ink,
      ...sx,
    }}
  >
    {children}
  </Typography>
);

const RuleAccent = ({ sx = {} }) => (
  <Box sx={{ width: 56, height: 3, backgroundColor: C.gold, my: { xs: 3, md: 4 }, ...sx }} />
);

// ─── Tiny top-right login link (non-pushy) ────────────────────────
const LoginLink = () => (
  <Box
    sx={{
      position: 'absolute',
      top: { xs: 16, md: 24 },
      right: { xs: 20, md: 40 },
      zIndex: 10,
    }}
  >
    <Box
      component="a"
      href="/login"
      sx={{
        fontFamily: SANS,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: C.muted,
        textDecoration: 'none',
        borderBottom: `1px solid transparent`,
        transition: 'border-color 0.2s',
        '&:hover': { borderBottomColor: C.gold, color: C.charcoal },
      }}
    >
      Login
    </Box>
  </Box>
);

// ─── Page ──────────────────────────────────────────────────────────
const PitchLandingPage = () => {
  // Set body bg + meta noindex on mount
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = C.cream;

    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);

    const title = document.title;
    document.title = 'PropVantage AI — for HubTown';

    return () => {
      document.body.style.backgroundColor = prevBg;
      document.head.removeChild(meta);
      document.title = title;
    };
  }, []);

  return (
    <Box sx={{ backgroundColor: C.cream, fontFamily: SANS, position: 'relative' }}>
      <LoginLink />

      {/* ─────────────────────────────────────────────────────────────────────
          1. HERO — direct to 25 South / HubTown
      ───────────────────────────────────────────────────────────────────── */}
      <Section sx={{ pt: { xs: 14, md: 18 }, pb: { xs: 8, md: 10 } }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
          <Kicker>For Rushank Shah · HubTown · 25 South</Kicker>

          <BigNum sx={{ color: C.charcoal, mb: { xs: 4, md: 6 } }}>₹1,000 Cr.</BigNum>

          <H2 sx={{ color: C.charcoal, maxWidth: 920, mb: 4 }}>
            That's what 25 South is leaving on the table every month.
          </H2>
          <Lead sx={{ maxWidth: 760, color: C.muted }}>
            Not because the Mumbai luxury market is soft. Because the operations are leaky —
            and right now, nobody can see exactly where.
          </Lead>

          <RuleAccent />
          <Body dim sx={{ maxWidth: 720, fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
            The number on this page comes from a direct conversation with Pratiksha,
            site head at 25 South. Nothing here is estimated or modeled.
            Everything is HubTown's own data.
          </Body>
        </Box>
      </Section>

      {/* ─────────────────────────────────────────────────────────────────────
          2. THE MATH — 25 South funnel, plain English
      ───────────────────────────────────────────────────────────────────── */}
      <Section dark sx={{ py: { xs: 10, md: 14 } }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
          <Kicker dark>The math behind ₹1,000 crore</Kicker>
          <H2 sx={{ color: C.inkOnDark, mb: 6 }}>
            One month at 25 South, broken down.
          </H2>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: { xs: 4, md: 8 },
              mt: { xs: 6, md: 8 },
            }}
          >
            {/* Left column — the funnel */}
            <Box>
              {[
                { label: 'Enquiries received', value: '100', sub: 'per month' },
                { label: 'Bookings confirmed', value: '10', sub: '10% conversion · ₹500 Cr captured' },
                {
                  label: 'Lost — genuine reasons',
                  value: '60–70',
                  sub: 'Vastu, brand preference, personal choice — unrecoverable',
                  muted: true,
                },
                {
                  label: 'Lost — operational reasons',
                  value: '20–30',
                  sub: 'Missed follow-ups, scattered documents, info not at the right place',
                  highlight: true,
                },
              ].map((row, idx) => (
                <Box
                  key={idx}
                  sx={{
                    borderTop: `1px solid ${row.highlight ? C.goldSoft : '#3A3A3A'}`,
                    py: { xs: 2.5, md: 3 },
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: 3,
                    alignItems: 'baseline',
                  }}
                >
                  <Box
                    sx={{
                      fontFamily: SERIF,
                      fontWeight: 700,
                      fontSize: { xs: '2rem', md: '2.6rem' },
                      lineHeight: 1,
                      color: row.highlight ? C.goldSoft : row.muted ? C.mutedOnDark : C.inkOnDark,
                      minWidth: { xs: 90, md: 130 },
                    }}
                  >
                    {row.value}
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: SANS,
                        fontSize: { xs: '0.95rem', md: '1.05rem' },
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        color: row.highlight ? C.goldSoft : C.inkOnDark,
                        mb: 0.5,
                      }}
                    >
                      {row.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: SANS,
                        fontSize: { xs: '0.85rem', md: '0.95rem' },
                        color: C.mutedOnDark,
                        lineHeight: 1.5,
                      }}
                    >
                      {row.sub}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Right column — the punchline */}
            <Box
              sx={{
                pl: { xs: 0, md: 6 },
                borderLeft: { xs: 'none', md: `1px solid #3A3A3A` },
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Kicker dark>Operational opportunity loss</Kicker>
              <BigNum sx={{ color: C.goldSoft, fontSize: { xs: '3.5rem', md: '5.5rem', lg: '6.5rem' }, mb: 3 }}>
                ₹1,000+ Cr
              </BigNum>
              <Lead dark sx={{ color: C.inkOnDark }}>
                Every month. At one project. From operational issues that have nothing to do
                with the buyer's decision.
              </Lead>
              <Body sx={{ color: C.mutedOnDark, mt: 3, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                20–30 leads lost × ₹50 Cr average ticket size = the number above.
                Not market risk. Not buyer risk. Process risk.
              </Body>
            </Box>
          </Box>
        </Box>
      </Section>

      {/* ─────────────────────────────────────────────────────────────────────
          3. WHY THIS IS HAPPENING — operational reality
      ───────────────────────────────────────────────────────────────────── */}
      <Section sx={{ backgroundColor: C.creamSoft }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
          <Kicker>Why this is happening</Kicker>
          <H2 sx={{ color: C.charcoal, maxWidth: 920, mb: 5 }}>
            Today, the entire lead journey lives in five different places.
          </H2>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(5, 1fr)' },
              gap: { xs: 3, md: 4 },
              mt: { xs: 4, md: 6 },
            }}
          >
            {[
              { title: 'Excel sheets', sub: 'for unit inventory and pricing' },
              { title: 'WhatsApp groups', sub: 'for buyer follow-ups and team coordination' },
              { title: 'Paper notes', sub: 'for site-visit feedback and buyer preferences' },
              { title: 'Scattered drives', sub: 'for cost sheets, brochures, agreements' },
              { title: 'Personal memory', sub: 'for who promised what to whom' },
            ].map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  backgroundColor: C.cream,
                  borderTop: `3px solid ${C.gold}`,
                  p: { xs: 3, md: 3.5 },
                  minHeight: { xs: 'auto', md: 170 },
                }}
              >
                <Typography
                  sx={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: { xs: '1.4rem', md: '1.5rem' },
                    color: C.charcoal,
                    mb: 1.5,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography sx={{ fontFamily: SANS, fontSize: '0.95rem', color: C.muted, lineHeight: 1.55 }}>
                  {item.sub}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              mt: { xs: 6, md: 8 },
              p: { xs: 4, md: 5 },
              borderLeft: `4px solid ${C.gold}`,
              backgroundColor: C.cream,
            }}
          >
            <Lead sx={{ color: C.charcoal }}>
              There is no single screen anywhere in the company that shows
              the lead journey from enquiry to handover.
            </Lead>
            <Body sx={{ color: C.muted, mt: 2 }}>
              When a deal slips, nobody can answer: <em>when was the last follow-up, who promised
              what at the site visit, why did the buyer go cold</em>. There's no record to ask the
              question against. There's no accountability trail. The ₹50 crore walks out the door
              and nobody knows exactly why.
            </Body>
          </Box>
        </Box>
      </Section>

      {/* ─────────────────────────────────────────────────────────────────────
          4. THE TRANSITION — "What if one screen..."
      ───────────────────────────────────────────────────────────────────── */}
      <Section dark sx={{ py: { xs: 10, md: 16 } }}>
        <Box sx={{ maxWidth: 920, mx: 'auto' }}>
          <Kicker dark>What changes</Kicker>
          <H2 sx={{ color: C.inkOnDark, mb: 5 }}>
            One platform. Every enquiry, every site visit, every commitment,
            every overdue payment — in one place.
          </H2>
          <Lead dark sx={{ color: C.mutedOnDark, fontSize: { xs: '1.1rem', md: '1.4rem' } }}>
            And an AI reading all of it for you, every day — telling you which leads to call
            this afternoon, which units are underpriced, which payments are about to slip.
          </Lead>
        </Box>
      </Section>

      {/* ─────────────────────────────────────────────────────────────────────
          5. FOUR THINGS — with money outcomes
      ───────────────────────────────────────────────────────────────────── */}
      <Section>
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
          <Kicker>What PropVantage does for HubTown</Kicker>
          <H2 sx={{ color: C.charcoal, mb: 6, maxWidth: 920 }}>
            Four things. Each one tied to money you're losing right now.
          </H2>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 5 } }}>
            {[
              {
                title: 'Track every lead from first enquiry to final cheque.',
                desc: 'Every interaction logged. Every follow-up scheduled. Every commitment captured. When a lead goes cold, you know exactly when, why, and who dropped the ball. No more "I forgot to call back on Tuesday."',
                outcome: 'Recovery potential',
                amount: '₹300–500 Cr / month',
                note: 'Recovering even half of the 20–30 operationally-lost leads at 25 South',
              },
              {
                title: 'Spot underpricing automatically.',
                desc: 'Daily AI comparison against every active luxury project in BKC, Worli, and Bandra West. The system tells you which of your units are priced below the market percentile, and by how much.',
                outcome: 'Pricing intelligence',
                amount: 'Continuous',
                note: 'Updated daily against real competitor data',
              },
              {
                title: 'Catch overdue payments on day 1, not day 90.',
                desc: 'The CFO sees every installment that\'s about to age before it does. Your collections team gets the call list automatically. The cash-flow leak is closed before it becomes a problem.',
                outcome: 'Collections acceleration',
                amount: '₹40–80 Cr / project',
                note: 'Based on typical aged-receivables recovery for ultra-luxury projects',
              },
              {
                title: 'Give leadership one screen.',
                desc: 'Every project, every team, every number — on one page. Drill into any cell to see the underlying transactions. No more "I\'ll have the CFO send you the file Friday."',
                outcome: 'Decision speed',
                amount: 'Minutes, not meetings',
                note: 'Same intelligence available to every leader in real time',
              },
            ].map((card, idx) => (
              <Box
                key={idx}
                sx={{
                  p: { xs: 4, md: 5 },
                  backgroundColor: C.creamSoft,
                  borderTop: `4px solid ${C.gold}`,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography
                  sx={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: { xs: '1.5rem', md: '1.7rem' },
                    color: C.charcoal,
                    lineHeight: 1.2,
                    mb: 2.5,
                  }}
                >
                  {card.title}
                </Typography>
                <Body sx={{ color: C.muted, mb: 3, flexGrow: 1 }}>{card.desc}</Body>
                <Box sx={{ pt: 3, borderTop: `1px solid ${C.divider}` }}>
                  <Typography
                    sx={{
                      fontFamily: SANS,
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: C.gold,
                      mb: 1,
                    }}
                  >
                    {card.outcome}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: SERIF,
                      fontSize: { xs: '1.8rem', md: '2.2rem' },
                      fontWeight: 700,
                      color: C.charcoal,
                      lineHeight: 1.1,
                      mb: 1,
                    }}
                  >
                    {card.amount}
                  </Typography>
                  <Typography sx={{ fontFamily: SANS, fontSize: '0.85rem', color: C.muted }}>
                    {card.note}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Section>

      {/* ─────────────────────────────────────────────────────────────────────
          6. THE AI IN ACTION — concrete examples (no jargon)
      ───────────────────────────────────────────────────────────────────── */}
      <Section sx={{ backgroundColor: C.creamSoft, py: { xs: 10, md: 14 } }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
          <Kicker>What the AI actually tells you</Kicker>
          <H2 sx={{ color: C.charcoal, mb: 5, maxWidth: 920 }}>
            Three things your sales head sees on a Monday morning.
          </H2>

          {[
            {
              tag: 'Pricing recommendation',
              quote:
                'Marquis Sea Face is underpriced by ₹6–10K per square foot. You sit at the 35th percentile against comparable luxury inventory in Worli. Re-base 5BHK to ₹98K/sqft and penthouses to ₹118K/sqft — confidence 91%.',
              note: 'The AI compared 9 competitor projects in Worli, removed outliers, computed your placement, and proposed specific actions with confidence scores.',
            },
            {
              tag: 'Lead intelligence',
              quote:
                'Sanya Bhansali — 86/100, Priority Critical. Budget aligned 98%. Eight interactions in 60 days. Last contact 24 days ago. Property Portal source — undervaluing her on source quality alone.',
              note: 'Your sales head can triage 200 leads in 30 seconds. The system reads engagement signals your team knows intuitively, and ranks every active enquiry.',
            },
            {
              tag: 'Cash-flow alert',
              quote:
                'Marquis Sea Face: ₹61 Cr overdue across 5 installments. 47% of older Worli installments are aging. Trigger Tier-1 collections protocol on the 14 oldest. Estimated recovery: ₹85–110 Cr in 90 days.',
              note: 'The CFO doesn\'t wait for the monthly review. The system flags installments as they age, with a specific recovery playbook.',
            },
          ].map((item, idx) => (
            <Box
              key={idx}
              sx={{
                mb: { xs: 5, md: 6 },
                p: { xs: 4, md: 5 },
                backgroundColor: C.cream,
                borderLeft: `4px solid ${C.gold}`,
              }}
            >
              <Typography
                sx={{
                  fontFamily: SANS,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: C.gold,
                  mb: 2,
                }}
              >
                {item.tag}
              </Typography>
              <Lead sx={{ color: C.charcoal, mb: 2.5 }}>"{item.quote}"</Lead>
              <Body sx={{ color: C.muted }}>{item.note}</Body>
            </Box>
          ))}
        </Box>
      </Section>

      {/* ─────────────────────────────────────────────────────────────────────
          7. COMPARISON — Excel/WA vs NetSuite vs PropVantage
      ───────────────────────────────────────────────────────────────────── */}
      <Section sx={{ py: { xs: 10, md: 14 } }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <Kicker>The honest comparison</Kicker>
          <H2 sx={{ color: C.charcoal, mb: 6, maxWidth: 920 }}>
            What HubTown uses today vs what's possible.
          </H2>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr 1fr' },
              gap: 0,
              border: `1px solid ${C.divider}`,
              backgroundColor: C.cream,
            }}
          >
            {/* Header row */}
            <Box sx={{ p: 3, backgroundColor: C.charcoal, color: C.inkOnDark }}>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                What it covers
              </Typography>
            </Box>
            {['Excel + WhatsApp', 'NetSuite', 'PropVantage'].map((h, i) => (
              <Box
                key={h}
                sx={{
                  p: 3,
                  backgroundColor: i === 2 ? C.gold : C.charcoalSoft,
                  color: i === 2 ? '#FFFFFF' : C.inkOnDark,
                  textAlign: 'center',
                }}
              >
                <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
                  {h}
                </Typography>
              </Box>
            ))}

            {/* Rows */}
            {[
              ['Built specifically for real estate', false, false, true],
              ['Lead lifecycle — enquiry to handover', '½', false, true],
              ['Real-time AI pricing & market intelligence', false, false, true],
              ['Single screen for leadership', false, false, true],
              ['Time to go live', '—', '6–12 months', 'Days'],
              ['Consultant army required', '—', 'Yes', 'No'],
              ['Annual cost (25 users)', '₹0 + ₹1,000 Cr lost', '₹70–150 lakh', '₹86 lakh'],
            ].map((row, ridx) => (
              <React.Fragment key={ridx}>
                <Box
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderTop: `1px solid ${C.divider}`,
                    fontFamily: SANS,
                    fontWeight: 500,
                    color: C.charcoal,
                  }}
                >
                  {row[0]}
                </Box>
                {[1, 2, 3].map((ci) => {
                  const v = row[ci];
                  const isPV = ci === 3;
                  let display;
                  if (v === true) display = <Box sx={{ color: C.green, fontSize: '1.5rem', fontWeight: 700 }}>✓</Box>;
                  else if (v === false) display = <Box sx={{ color: C.muted, fontSize: '1.3rem' }}>—</Box>;
                  else if (v === '½') display = <Box sx={{ color: C.muted, fontSize: '0.95rem' }}>Partially</Box>;
                  else display = <Typography sx={{ fontFamily: SANS, fontSize: '0.95rem', fontWeight: isPV ? 600 : 400, color: isPV ? C.gold : C.charcoal }}>{v}</Typography>;
                  return (
                    <Box
                      key={ci}
                      sx={{
                        p: { xs: 2.5, md: 3 },
                        borderTop: `1px solid ${C.divider}`,
                        textAlign: 'center',
                        backgroundColor: isPV ? '#FBF6EC' : 'transparent',
                      }}
                    >
                      {display}
                    </Box>
                  );
                })}
              </React.Fragment>
            ))}
          </Box>

          <Box sx={{ mt: { xs: 5, md: 7 }, maxWidth: 920 }}>
            <Lead sx={{ color: C.charcoal }}>
              HubTown is already paying NetSuite ₹70+ lakh a year for an ERP that doesn't
              understand real estate.
            </Lead>
            <Body sx={{ color: C.muted, mt: 2 }}>
              For roughly the same money, you can have a platform that does. Plus the AI.
              Plus implementation. Plus every future integration we ship — at the same price.
            </Body>
          </Box>
        </Box>
      </Section>

      {/* ─────────────────────────────────────────────────────────────────────
          8. PRICING — Founding Partner card
      ───────────────────────────────────────────────────────────────────── */}
      <Section dark sx={{ py: { xs: 10, md: 16 } }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
          <Kicker dark>Founding Partner Pricing · for HubTown</Kicker>
          <H2 sx={{ color: C.inkOnDark, mb: 6, maxWidth: 920 }}>
            One number. No asterisks.
          </H2>

          <Box
            sx={{
              backgroundColor: C.cream,
              color: C.charcoal,
              p: { xs: 4, md: 7 },
              maxWidth: 900,
              boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
            }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: { xs: 4, md: 6 } }}>
              <Box>
                <Typography
                  sx={{
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: C.gold,
                    mb: 1.5,
                  }}
                >
                  Base — up to 15 users
                </Typography>
                <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: { xs: '3rem', md: '4rem' }, lineHeight: 1, mb: 1 }}>
                  ₹5,00,000
                </Typography>
                <Typography sx={{ fontFamily: SANS, fontSize: '0.95rem', color: C.muted }}>
                  per month · effective ₹33,333 / user
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontFamily: SANS,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    color: C.gold,
                    mb: 1.5,
                  }}
                >
                  Beyond 15 users
                </Typography>
                <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: { xs: '3rem', md: '4rem' }, lineHeight: 1, mb: 1 }}>
                  ₹20,000
                </Typography>
                <Typography sx={{ fontFamily: SANS, fontSize: '0.95rem', color: C.muted }}>
                  per user / month · 40% lower than base rate
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: { xs: 4, md: 6 }, pt: { xs: 4, md: 5 }, borderTop: `1px solid ${C.divider}` }}>
              <Typography
                sx={{
                  fontFamily: SANS,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: C.gold,
                  mb: 1.5,
                }}
              >
                One-time setup
              </Typography>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: { xs: '2rem', md: '2.5rem' }, lineHeight: 1 }}>
                ₹2,00,000
              </Typography>
              <Typography sx={{ fontFamily: SANS, fontSize: '0.95rem', color: C.muted, mt: 1 }}>
                Implementation, data migration, team onboarding — all included.
              </Typography>
            </Box>

            <Box sx={{ mt: { xs: 4, md: 5 }, pt: { xs: 4, md: 5 }, borderTop: `1px solid ${C.divider}` }}>
              <Typography
                sx={{
                  fontFamily: SANS,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: C.gold,
                  mb: 2.5,
                }}
              >
                Everything included
              </Typography>
              <Box component="ul" sx={{ pl: 0, listStyle: 'none', m: 0 }}>
                {[
                  'The full platform — leads, sales, payments, commissions, construction tracking, team management',
                  'All AI — competitive analysis, lead scoring, pricing intelligence, copilot chat',
                  'Implementation, data migration, ongoing support',
                  'Every future integration we add, at the same price — no upgrade fees, ever',
                ].map((item, i) => (
                  <Typography
                    key={i}
                    component="li"
                    sx={{
                      fontFamily: SANS,
                      fontSize: { xs: '0.95rem', md: '1.05rem' },
                      color: C.charcoal,
                      lineHeight: 1.65,
                      mb: 1.5,
                      pl: 3,
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 12,
                        width: 12,
                        height: 1,
                        backgroundColor: C.gold,
                      },
                    }}
                  >
                    {item}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>

          <Body sx={{ color: C.mutedOnDark, mt: 5, maxWidth: 760, fontStyle: 'italic' }}>
            Founding Partner pricing is reserved for our first five customers. Lock in for 36 months
            and these numbers don't move — even as we ship new modules, new integrations, new AI capabilities.
          </Body>
        </Box>
      </Section>

      {/* ─────────────────────────────────────────────────────────────────────
          9. THE CLOSING MATH — no CTA, just the line
      ───────────────────────────────────────────────────────────────────── */}
      <Section sx={{ py: { xs: 12, md: 18 }, backgroundColor: C.cream }}>
        <Box sx={{ maxWidth: 920, mx: 'auto' }}>
          <Kicker>The math, one last time</Kicker>

          <Box sx={{ mt: 4, mb: 5 }}>
            <Typography
              sx={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: { xs: '2.2rem', md: '3.2rem', lg: '3.8rem' },
                lineHeight: 1.15,
                color: C.charcoal,
                mb: 4,
              }}
            >
              At ₹86 lakh a year, PropVantage pays for itself if it recovers <span style={{ color: C.gold }}>one</span> missed booking.
            </Typography>

            <Typography
              sx={{
                fontFamily: SERIF,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: { xs: '1.4rem', md: '1.8rem' },
                lineHeight: 1.3,
                color: C.muted,
              }}
            >
              25 South loses 20–30 of them every month.
            </Typography>
          </Box>

          <RuleAccent sx={{ width: 80, height: 4 }} />

          <Body sx={{ color: C.muted, maxWidth: 720 }}>
            We're meeting in person to walk through the platform on HubTown's own data —
            three projects, real leads, real pricing, the full AI surface.
            This page is the pre-read.
          </Body>
        </Box>
      </Section>

      {/* ─────────────────────────────────────────────────────────────────────
          FOOTER — minimal
      ───────────────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          backgroundColor: C.charcoal,
          color: C.mutedOnDark,
          py: 4,
          px: { xs: 3, sm: 6, md: 10 },
          fontFamily: SANS,
          fontSize: '0.85rem',
          textAlign: 'center',
        }}
      >
        PropVantage AI · Built for Indian real estate · Prepared for HubTown · {new Date().getFullYear()}
      </Box>
    </Box>
  );
};

export default PitchLandingPage;

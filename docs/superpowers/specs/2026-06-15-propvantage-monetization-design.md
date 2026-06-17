# PropVantage AI — Monetization & Pricing Design

**Date:** 2026-06-15
**Status:** Approved direction (pending final spec review)
**Owners:** Founder/CEO + (this doc drafted in CEO/CFO framing)
**Scope:** Pricing strategy, tiering, discounting, billing operations, and the technical build required to charge for the platform from within the product. Excludes the *real-estate transaction* payment flows (buyer installments), which already exist and remain separate.

---

## 1. Executive summary

PropVantage AI is an **AI-native revenue operating system for Indian real-estate developers, with an integrated channel-partner (CP) network on the other side of a marketplace.** It spans three things competitors keep separate: CRM/sales, inventory + finance (ERP-lite), and an AI layer (NLI leadership report agent, copilots, insight digests, competitive research).

**Go-to-market:** Premium / enterprise-led, **ultra-luxury developers first**, expanding down-market in later phases.

**Monetization model:**
- **Developer side** — segment-named account tiers from ₹40k/mo (Core) to ₹5,00,000/mo (Signature), Full seats only, ₹5L as the hard ceiling, AI fully bundled.
- **CP side** — tiered, paid from ₹4k/mo (no permanent free tier), up to ₹25k/mo (Pro).
- **Billing** — annual prepay default (sidesteps RBI auto-debit caps and improves cash flow), Razorpay, +18% GST, TDS-aware invoicing.

A conservative luxury-first ramp (20 Signature + 30 Elite ≈ 50 marquee logos) yields **≈ ₹21Cr ARR** before seat expansion and CP revenue.

---

## 2. Market & competitive landscape

### 2.1 Market size

| Metric | Figure | Basis |
|---|---|---|
| India RE market | $650B (2025) → $1T (2030) | IBEF / FICCI-KPMG |
| India PropTech | $1.31B (2025), ~12% CAGR | IMARC |
| Organized developers (SAM) | ~15,000–20,000 (CREDAI 13,000+ / NAREDCO 15,000+) | CREDAI / NAREDCO |
| RERA-registered agents | ~100,000–106,000 (2025) | MoHUA aggregations |
| Total brokers incl. informal | 5–10 lakh (~90% subsistence) | industry estimate |

**Value framing that underpins premium pricing:** a developer doing ₹500Cr/yr in sales who pays ₹60L/yr (₹5L × 12) spends **0.12% of GMV** — trivial against even a 1% conversion lift.

### 2.2 Competitor pricing (per seat / month, INR; contact-sales figures flagged as estimates)

| Vendor | Entry | Top business tier | AI metering | Native ₹? | Vertical RE? |
|---|---|---|---|---|---|
| Salesforce Sales Cloud | $25 (₹2,100) | $350 Unltd → $550 (₹46k) Agentforce 1 | $2/conversation **or** $0.10/action | No (USD + 18% GST) | No vertical |
| MS Dynamics 365 Sales | ₹5,410 | ₹12,480 (Premium) | Copilot bundled at Ent+ | Yes | No |
| Zoho CRM (India) | ₹800 | ₹2,400–2,600 | Zia bundled at Ent+ | Yes | No |
| **Sell.Do** (closest direct) | ~₹1,799 (est) | quote | AI calling, sentiment | Yes (quote) | Yes |
| LeadRat | ₹500–700 (annual, min 10) | ₹1,499–2,299 (monthly) | thin | Yes | Yes |
| Propacity (RYT) (model-twin) | opaque | opaque | "BHAI" assistant | Yes (quote) | Yes |
| Anarock ASTRA (AI-depth) | enterprise only | enterprise | deepest AI stack | rev-share | Yes |
| Farvision / In4Suite (ERP) | ₹4,000/user/module + ₹2k hosting | quote | marketing-level | Yes | Yes (ERP) |

**Two structural facts that shaped this plan:**
1. The credible per-seat band for an Indian RE CRM is **₹500–₹2,600/seat/mo**; ₹4,000+ is ERP territory. Our top tier's *implied* per-seat (₹33k) is therefore a **bundle artifact, not a market seat price** — defensible only as a value-priced account for a developer selling ₹500Cr+.
2. The market norm is that **channel partners get tools free** (developer-funded via brokerage; Anarock charges developers 1.5–2.5% of sale value, CP pays nothing). We are deliberately charging CPs a *modest, tiered* fee instead — accepted as a founder decision, with the network-density trade-off noted as a risk (§9).

### 2.3 Where we win (competitive edge)

- **Vertical-native vs Salesforce's horizontal** — Salesforce has no RE vertical, no INR list price, bills USD + 18% GST, and needs an SI + third-party RE app. Wedge: *"Why pay 5–10× for a non-RE tool billed in dollars that you still have to assemble?"*
- **AI surfaces competitors lack** — the conversational **NLI leadership report agent** ("ask your business a question") is a genuine differentiator; Sell.Do has AI calling but not this, Anarock's deep AI is closed/enterprise-only and tied to Anarock-mandated projects.
- **True two-sided network** — developers + CPs + commission reconciliation + marketplace on one platform = lock-in and data network effects nobody else has integrated.
- **CRM↔ERP-lite span** — inventory, cost sheets, payment plans, commission invoicing — close to Farvision/In4Suite depth but AI-native and faster to deploy.
- **Pricing transparency** — in a market where almost everyone is "contact sales."

---

## 3. Unit economics (cost basis)

AI is the only meaningful variable cost; infra (MongoDB Atlas, AWS S3, Node on AWS, Vercel) is largely fixed/shared. Derived from the actual code: Claude Sonnet 4-6 + GPT-4o + gpt-4o-search, with 24h/7d/30d caching on insights, and an existing `AIUsageMeter` tracking per-org token cost.

| | Active developer account | CP account |
|---|---|---|
| AI variable cost (typical) | ₹8,000–₹18,000/mo | ₹1,500–₹3,500/mo |
| AI cost (heavy power user) | ₹30,000–₹50,000/mo | ~₹5,000/mo |
| Infra marginal | ₹500–₹2,000/mo | ~₹500/mo |

**Implication:** at ₹5L/mo, AI is immaterial (≥90% gross margin). At lower tiers, *uncontrolled* AI could eat 30–60% of revenue — hence **per-tier AI quota guardrails** (§5.5), enforced silently via the existing `aiQuota` infrastructure.

---

## 4. Addressable users & revenue model

| | Developer side | Channel-partner side |
|---|---|---|
| TAM | ~20,000 organized + tens of thousands unorganized | ~100,000 agents / ~10–15k organized firms |
| SAM (premium-ready) | ~3,000–5,000 accounts | ~5,000–8,000 firms |
| Realistic 3-yr SOM | 150–300 accounts (~1,500–4,000 seats) | a few hundred to low thousands of firms |

**Illustrative 18–24 month luxury-first scenario:** 20 Signature + 30 Elite = ₹1Cr + ₹75L = **₹1.75Cr/mo ≈ ₹21Cr ARR** from ~50 marquee logos, before add-on Full-seat expansion (realistically +30–50%) and CP revenue.

---

## 5. Pricing catalog

All prices are **exclusive of 18% GST**. Cycles: **monthly · quarterly (−8%) · annual (−17%, ≈ 2 months free) · multi-year (additional −5–10% + price-lock).**

### 5.1 Developer tiers (Full seats only; ₹5L hard ceiling)

| Tier (segment) | Monthly | Quarterly (−8%) | Annual (−17%) | Full seats incl. | Add-on Full seat |
|---|---|---|---|---|---|
| **Signature** — Ultra-Luxury (₹5Cr+ ticket) | ₹5,00,000 | ₹13,80,000 | ₹50,00,000 | 15 | ₹25,000 |
| **Elite** — Luxury (₹2–5Cr) | ₹2,50,000 | ₹6,90,000 | ₹25,00,000 | 10 | ₹20,000 |
| **Growth** — Premium/Mid (₹75L–2Cr) | ₹1,00,000 | ₹2,76,000 | ₹10,00,000 | 7 | ₹12,000 |
| **Core** — Emerging/Small (<₹75L) | ₹40,000 | ₹1,10,400 | ₹4,00,000 | 4 | ₹8,000 |

A Signature account that needs >15 users grows past ₹5L via add-on Full seats, so the ceiling is not a revenue cap. **GTM sequencing:** sell Signature + Elite first; Growth/Core serve inbound + down-market expansion in Phase 2.

### 5.2 Channel-partner tiers (paid from Starter; time-boxed trial, no permanent free tier)

| Tier | Monthly | Quarterly (−8%) | Annual (−17%) | Seats incl. | Add-on seat |
|---|---|---|---|---|---|
| **Starter** | ₹4,000 | ₹11,040 | ₹40,000 | 2 | ₹2,000 |
| **Growth** | ₹12,000 | ₹33,120 | ₹1,20,000 | 3 | ₹3,000 |
| **Pro** | ₹25,000 | ₹69,000 | ₹2,50,000 | 5 | ₹4,000 |

Implied per-seat: ₹1,750 (Starter) → ₹5,000 (Pro) — inside the market band at entry, premium-but-justified at the top.

### 5.3 Feature entitlements — developer

| Capability | Core | Growth | Elite | Signature |
|---|---|---|---|---|
| CRM (leads, pipeline) | ✓ | ✓ | ✓ | ✓ |
| Inventory (projects/towers/units) | ✓ | ✓ | ✓ | ✓ |
| Payments / invoicing | ✓ | ✓ | ✓ | ✓ |
| Copilot (AI) | limited | ✓ | ✓ | ✓ |
| Commission management | — | ✓ | ✓ | ✓ |
| Cost-sheet + dynamic pricing | — | ✓ | ✓ | ✓ |
| NLI report agent | — | capped | ✓ | unlimited |
| Predictive analytics | — | — | ✓ | ✓ |
| Competitive / market AI research | — | — | ✓ | ✓ |
| Approvals / governance | — | — | ✓ | ✓ |
| SSO/SAML, custom roles, API, SLA | — | — | — | ✓ |
| Support | standard | standard | priority | dedicated CSM / white-glove |

### 5.4 Feature entitlements — channel partner

| Capability | Starter | Growth | Pro |
|---|---|---|---|
| Marketplace + prospect pipeline | ✓ | ✓ | ✓ |
| Commission tracking | basic | reconciliation | reconciliation |
| CP copilot (AI) | — | ✓ | ✓ |
| Developer-performance insights | — | ✓ | ✓ |
| AI digest cadence | weekly | monthly | full |
| Multi-developer management | — | — | ✓ |
| Team management | — | limited | ✓ |
| Priority support | — | — | ✓ |

### 5.5 AI quota guardrails (internal only — invisible to customer)

AI is **fully bundled**. Quotas exist purely as a margin guardrail via the existing `aiQuota` (daily/hourly) mechanism, with fair-use + in-app upgrade nudge on sustained overage (no overage billing). An "AI action" = one on-demand AI generation as already metered in `AIUsageMeter` (`onDemandGenerations` + `copilotMessages`); scheduled/cron digests do not count against the guardrail.

| Tier | Daily AI-action guardrail |
|---|---|
| Signature | ~2,000 (effectively unlimited) |
| Elite | 1,000 |
| Growth | 400 |
| Core | 150 |
| CP Pro | 200 |
| CP Growth | 80 |
| CP Starter | 30 |
| **Trial (any)** | **25 (tight — prevents tire-kicker AI cost)** |

### 5.6 Discounting framework & governance

- **Annual prepay −17%** ("2 months free"). **Quarterly −8%.** **Multi-year additional −5–10% + price-lock.**
- **Lighthouse / founding-customer −25–40%** for the first 5–10 marquee logos, time-boxed 12 months, in exchange for a case study + reference call, then step up to list.
- **Discount approval matrix:** AE ≤10% · Sales Head ≤20% · CEO/CFO beyond. No ad-hoc discounts off this matrix; discounts do not stack beyond the CEO/CFO-approved floor.

---

## 6. Billing operations & policy

### 6.1 Collection rails (RBI-constrained)

RBI's e-mandate rules cap *silent* auto-debit at ₹15k/transaction; every developer tier and CP Pro exceed it.

- **Annual prepay is the default** for all developer tiers + CP Pro — Razorpay invoice + NEFT/RTGS/payment-link. Sidesteps the mandate cap, improves cash flow, reduces churn, and is what the −17% annual discount funds.
- **UPI Autopay / e-mandate auto-debit** only for sub-₹15k monthly plans (CP Starter ₹4k, CP Growth ₹12k).
- **Gateway:** Razorpay (UPI, cards, netbanking, e-NACH, GST invoices). Already referenced in the codebase for buyer payments; reuse for SaaS billing as a separate domain.

### 6.2 Taxes

- **GST 18%** added to all list prices; capture customer **GSTIN** at checkout; compliant tax invoices; place-of-supply logic (IGST inter-state / CGST+SGST intra-state).
- **TDS:** B2B customers may deduct 2% (194C) or 10% (194J). Invoicing must anticipate net-of-TDS receipts and track TDS receivable; reconcile via Form 26AS/AIS and collect Form 16A. **Action:** obtain a one-time CA opinion on the correct TDS treatment to state on invoices.

### 6.3 Trial

- **14-day self-serve free trial**, all tiers, with the tight trial AI quota (§5.5). **Card-on-file recommended at trial start** to lift intent and ease conversion. Sales may layer a guided pilot on Signature/Elite.

### 6.4 Lifecycle

- **Upgrade:** immediate, prorated (credit unused portion). **Downgrade / seat removal:** at term end (anti-gaming). **Seat add:** immediate, prorated.
- **Auto-renewal:** on, with 30-day advance notice; **price-lock during a paid term** (grandfathering); increases apply only at renewal with notice.

### 6.5 Cancellation & refunds

- **Stance: no-refund on committed prepaid terms + 7-day cooling-off** on first purchase (money-back). Cash refunds only on our SLA breach; otherwise credit notes.
- **Cancellation:** turns off renewal; service runs to end of paid term → **30-day read-only grace** for data export → suspend → retain 90 days → delete (DPDP-aligned).

### 6.6 Dunning

- Auto-debit fail → retry day 1/3/5/7 + dunning emails + in-app banner → 14-day grace → soft-suspend (read-only) → hard-suspend day 30 → retain 90 days.
- Enterprise invoices: Net-15/30; reminders due−7/due/+7/+15; account-manager escalation before suspension. (`node-cron` + `nodemailer` already present.)

### 6.7 Compliance & enterprise-readiness

- **DPDP Act 2023:** consent, purpose limitation, DPA for enterprise, breach notification, grievance officer.
- **Contract stack:** ToS, Order Form, Refund & Cancellation Policy, Privacy Policy, DPA, enterprise MSA.
- **Data residency (pre-launch action):** migrate primary data from AWS `ap-southeast-2` (Sydney) + MongoDB Atlas to **AWS Mumbai `ap-south-1`** for DPDP comfort, latency, and enterprise procurement.
- **Security pack for ₹5L procurement:** SSO/SAML (Signature), audit logs, RBAC (exists), encryption-at-rest (exists), SOC 2 roadmap for the largest logos.

---

## 7. Technical design

### 7.1 Already built (monetization hooks)

- `Organization.subscriptionPlan` enum (`trial/starter/professional/enterprise`)
- `Organization.aiQuota` (daily/hourly/plan) + AI rate-limiting middleware
- `AIUsageMeter` (per-org, per-day token + cost, scheduled vs on-demand split)

### 7.2 To build

| Component | Notes |
|---|---|
| **Entitlements engine** | Map tier → feature flags; extend existing permission infra with plan entitlements (FE + BE) |
| **Seat allocation + enforcement** | Count active users vs allocation; block/charge over-allocation; Full-seat-only model |
| **Razorpay integration** | Subscriptions, e-mandate (UPI Autopay), invoices, payment links, webhooks |
| **SaaS invoicing** | GST-compliant invoices, GSTIN capture, place-of-supply, TDS-aware receipts |
| **Proration engine** | Upgrades, mid-term seat adds |
| **Dunning automation** | Retry schedule, grace, suspension state machine |
| **Billing UI** | Pricing page, checkout, plan management, invoices, payment methods, usage dashboard |
| **Internal billing/admin console** | Manage subscriptions, comp accounts, apply discounts (approval matrix), MRR/ARR + revenue reporting |
| **Discount/coupon engine** | Annual/quarterly/multi-year/lighthouse, approval matrix enforcement |
| **Audit log** | Billing events, plan changes, access changes |

### 7.3 New data model (proposed)

`Plan`, `Subscription` (org, plan, cycle, status, term start/end, seats), `SeatAllocation`, `SaaSInvoice` (GST/TDS fields), `PaymentMethod`/`Mandate`, `Coupon`/`Discount`, `BillingEvent`. Kept strictly separate from the existing buyer-payment models (`PaymentPlan`/`Installment`/`PaymentTransaction`/`Invoice`).

### 7.4 Phased implementation outline (for the implementation plan)

- **Phase 0 — Foundations:** data-residency migration (Mumbai); legal/policy doc stack; CA opinion on TDS.
- **Phase 1 — Entitlements & seats:** entitlements engine, seat enforcement, wire `aiQuota` to tiers. (Can gate existing accounts before payment exists.)
- **Phase 2 — Billing core:** Razorpay (invoices/subscriptions/e-mandate/webhooks), GST invoicing, proration, trial logic.
- **Phase 3 — Self-serve billing UI:** pricing page, checkout, plan management, invoices, usage.
- **Phase 4 — Lifecycle automation:** dunning, renewal notices, cancellation flow, TDS reconciliation, discount/coupon engine.
- **Phase 5 — Internal billing/admin console:** subscription management, comps, discount approvals, MRR/ARR dashboards.

---

## 8. Decisions locked (this session)

1. **GTM:** Premium / enterprise-led; ultra-luxury developers first.
2. **Developer pricing basis:** Segment-named account tiers; ₹5L = ultra-luxury ceiling; lower tiers for mid/small later.
3. **Developer seats:** Full seats only (Field-Lite deferred to mid-market expansion).
4. **Top ceiling:** ₹5L is the hard ceiling (no Portfolio tier above it; mega-accounts grow via add-on seats).
5. **CP pricing:** Tiered, paid from ₹4k; no permanent free tier.
6. **AI billing:** Fully bundled into tiers; internal quota guardrails only.
7. **Refunds:** No-refund on committed terms + 7-day cooling-off; SLA-breach credit notes.
8. **Trial:** 14-day self-serve free trial (tight trial AI quota; card-on-file recommended).
9. **Collection:** Annual prepay default + invoice/NEFT for high tiers; UPI/e-mandate for sub-₹15k monthly; Razorpay.
10. **Taxes:** +18% GST on all prices; TDS-aware invoicing.

---

## 9. Risks & open items

- **CP-charging vs free-to-broker norm** — direct CP fees may slow network density (the two-sided moat). Monitor CP adoption; revisit if growth stalls.
- **14-day self-serve trial + AI cost** — mitigated by tight trial quota + card-on-file; watch trial AI spend.
- **TDS treatment uncertainty** — resolve via CA opinion before launch.
- **Enterprise procurement friction** at ₹5L (security questionnaires, MSA redlines) — prepare a security/compliance pack.
- **Annual churn risk** — ensure value realization in first 90 days (onboarding/CSM).
- **Existing/pilot customers** — define grandfathering / founder-deal handling.
- **Field-Lite seats deferred** — reopen when expanding into mid/affordable (field sales armies).

---

## 10. Sources (pricing & market)

- Salesforce: g2.com, tech.co, salesforce.com/blog/flex-credits, trustradius (editions + Agentforce $2/conv, $0.10/action).
- Zoho CRM India: zoho.com/crm/zohocrm-pricing.html.
- LeadRat: leadrat.com/pricing. Sell.Do: techjockey.com, getapp.com (estimates, contact-sales).
- Farvision: farvision.in/pricing. Anarock: anarock.com/technology, blogs.anarock.com.
- MS Dynamics 365 Sales India: microsoft.com/en-in/dynamics-365/products/sales/pricing.
- Market sizing: CREDAI (credai.org), NAREDCO (naredco.in), IBEF, FICCI-KPMG, IMARC; RERA agents via MoHUA aggregations (therealtytoday, Business Standard).

*AI cost figures are estimates from code inspection (model IDs, call patterns, caching); contact-sales competitor prices are third-party estimates and flagged as such.*

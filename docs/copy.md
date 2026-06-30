# LevelStack Copy Bible

Canonical customer-facing strings for LevelStack. Planning mirror: `lpd-planning/COPY_BANK.md` §7.

## Product names

| Tier | Name |
|---|---|
| Free | Visibility Snapshot |
| Paid ($97) | Action Roadmap |
| Premium ($297) | Action Roadmap + Strategy Call |

Runtime: `lib/report/outcome-copy.ts` → `PRODUCT_NAMES`.

## Translation engine

See `lib/prompts/levelstackCopyPrompt.ts` and AGENTS.md § LevelStack Data-to-Copy Translation Engine.

## Frontend scannability

- Headline + max 3 bullets (≤15 words each)
- `leading-relaxed tracking-tight` on short fragments
- Lucide severity anchors: AlertTriangle (Revenue Risk), Zap (Performance Leak), Shield (Verified Asset), Lock (locked modules)
- Color tokens: red-50/700 (danger), amber-50/700 (attention), emerald-50/700 (verified)

## Approved static strings

### Upgrade banner

- Lead: "Want us to automate these fixes for you? Apply for early access."
- Body: SAP at capacity + Action Roadmap $97 + waitlist + assessment fee credit
- Button: "Unlock Action Roadmap & Join Priority Waitlist"

### Locked section modal

- Title: "Unlock Your 90-Day Action Blueprint & Competitive Analysis"
- CTA: "Unlock Action Roadmap — $97 (100% assessment fee credited if you join the SEO Automator Pro waitlist)"
- Secondary: "Return to Visibility Snapshot"

### SAP waitlist modal

- Title: "Secure Your Charter Spot for SEO Automator Pro"
- CTA: "Apply for Early Access & Lock in My $97 Credit"
- URL: `/platform/seo?source=levelstack_report_credit`

### Charter guarantee (hub checkout)

**100% Risk-Free Charter Guarantee:** Secure your Action Roadmap today for $97. Priority waitlist + assessment fee credit at SAP onboarding. Dashboard live immediately.

## Email subjects (Workflow B waitlist)

| ID | Subject |
|---|---|
| W1 | You're on the list (and your $97 credit is locked in) |
| W2 | The anatomy of a "D" Grade (And the local search leak) |
| W3 | Why [Industry/Niche] businesses are ditching traditional agencies |
| W4 | Cohort update: preparing the next automation slots |

## App root landing (levelstack.levelplaydigital.com)

Mirror: COPY_BANK §7.2.

**Voice:** Consultant who simplifies — specific observations, diagnosis, honest scope.

| Field | Copy |
|---|---|
| Hero | What prospects see before they call you. |
| Subhead | We look at search, reviews, and gaps rivals use against you. Free snapshot first. Action Roadmap for $97 when you are ready to act. |
| Section h2 | What you get |
| Card 1 | **First impression** — Search and presence. Where prospects decide. |
| Card 2 | **Live research** — Real data from your market. Not a generic checklist. |
| Card 3 | **Honest scope** — We show priorities. You act. No rank or sales promises. |
| Footer | We spot gaps. You fix them. No rank or sales promises. |
| Meta | What prospects see before they call. Free snapshot. Action Roadmap $97. |

**Readability (tiered):** Hero FK ≤ 6; body/card FK ≤ 5; CTAs/footer FK ≤ 4; sentences ≤ 15 words.

## FAQs

Full canonical list: COPY_BANK §7.1. In-app subset: `data/action-roadmap-faqs.ts`.

import { TERMS } from "@/lib/report/customer-terms"

export const REPORT_INTRO = {
  title: "How to read your dashboard",
  body: [
    "This is your LevelStack Visibility Snapshot — a diagnostic of how prospects likely see your business online across search, reputation, digital presence, your funnel, and competitors.",
    "Findings use outcome labels like Revenue Risk and Visibility Leak so you see business impact, not jargon. Start with Executive summary, then use the tabs for detail. Unlock your 90-Day Action Blueprint for prioritized fixes with copy-paste assets.",
  ],
  note: "Diagnostic only — you or your team execute the fixes. LevelStack does not guarantee rankings or revenue outcomes.",
} as const

/** Inline text: plain, bold, or brand accent */
export type GuideSegment = {
  t: string
  b?: boolean
  c?: "accent"
}

export type SectionGuideBlock =
  | { type: "p"; segments: GuideSegment[] }
  | { type: "ul"; items: GuideSegment[][] }
  | { type: "ol"; items: GuideSegment[][] }
  | { type: "callout"; tone: "tip" | "important"; segments: GuideSegment[] }

export type SectionGuide = {
  what: string | SectionGuideBlock[]
  why: string | SectionGuideBlock[]
}

export const seg = {
  t: (t: string): GuideSegment => ({ t }),
  b: (t: string): GuideSegment => ({ t, b: true }),
  a: (t: string): GuideSegment => ({ t, c: "accent" }),
}

export const SECTION_GUIDES: Record<string, SectionGuide> = {
  executive_summary: {
    what: "A plain-language overview of what people likely find when they search for you, your single biggest risk, and the first actions to consider.",
    why: "Owners rarely have time to read every finding first — this section tells you whether the report is urgent and where to focus before you dive into the tabs.",
  },
  search_footprint: {
    what: [
      {
        type: "p",
        segments: [
          seg.t("This tab shows "),
          seg.b("how people find you online"),
          seg.t(" when they search your business name or what you sell."),
        ],
      },
      { type: "p", segments: [seg.b("We looked at:")] },
      {
        type: "ul",
        items: [
          [
            seg.t("What shows up on "),
            seg.b("Google"),
            seg.t(" when someone searches for you"),
          ],
          [
            seg.t("Whether your "),
            seg.b("name and offer"),
            seg.t(" appear clearly in results"),
          ],
          [
            seg.t("How you might show up in "),
            seg.b("AI answers"),
            seg.t(` (e.g. ChatGPT, Perplexity, ${TERMS.aiOverview})`),
          ],
        ],
      },
      {
        type: "callout",
        tone: "tip",
        segments: [
          seg.t("Tip: "),
          seg.b("Read findings top to bottom"),
          seg.t(" — red flags usually need attention before smaller polish items."),
        ],
      },
    ],
    why: [
      {
        type: "p",
        segments: [
          seg.b("Most new customers discover you before they ever call or visit."),
        ],
      },
      {
        type: "ul",
        items: [
          [
            seg.t("If search results look empty, outdated, or confusing, "),
            seg.b("trust drops before you get a chance to explain yourself."),
          ],
          [
            seg.t("Fixing visibility here often improves "),
            seg.a("leads and phone calls"),
            seg.t(" without spending more on ads."),
          ],
        ],
      },
      {
        type: "callout",
        tone: "important",
        segments: [
          seg.b("Bottom line:"),
          seg.t(" Search is your digital front door — this section shows whether it’s open."),
        ],
      },
    ],
  },
  online_reputation: {
    what: [
      {
        type: "p",
        segments: [
          seg.t("This tab covers "),
          seg.b("trust signals strangers use"),
          seg.t(" to decide if you’re worth contacting."),
        ],
      },
      { type: "p", segments: [seg.b("You’ll see:")] },
      {
        type: "ul",
        items: [
          [
            seg.b("Reviews and star ratings"),
            seg.t(" on Google and other sites"),
          ],
          [
            seg.t("Whether your business info is "),
            seg.b("consistent"),
            seg.t(" across directories (name, phone, address)"),
          ],
          [
            seg.t("Gaps that make you look "),
            seg.b("inactive or hard to reach"),
          ],
        ],
      },
      {
        type: "ol",
        items: [
          [
            seg.t("Scan for "),
            seg.b("low volume or low ratings"),
            seg.t(" first"),
          ],
          [seg.t("Note any "), seg.b("missing or wrong listings")],
          [seg.t("Use the action plan tab for who should fix what")],
        ],
      },
    ],
    why: [
      {
        type: "p",
        segments: [
          seg.b("People compare you to others in seconds"),
          seg.t(" — often based on stars and reviews alone."),
        ],
      },
      {
        type: "ul",
        items: [
          [
            seg.t("Strong reputation makes "),
            seg.a("every other marketing dollar"),
            seg.t(" work harder."),
          ],
          [
            seg.b("Weak or uneven reputation"),
            seg.t(" can kill deals even when your website looks great."),
          ],
        ],
      },
      {
        type: "callout",
        tone: "important",
        segments: [
          seg.b("You don’t need perfect reviews"),
          seg.t(" — you need enough recent, credible proof that you’re real and responsive."),
        ],
      },
    ],
  },
  digital_presence: {
    what: [
      {
        type: "p",
        segments: [
          seg.t("This tab is about your "),
          seg.b("public face online"),
          seg.t(" — the places people land after they find you."),
        ],
      },
      { type: "p", segments: [seg.b("Includes:")] },
      {
        type: "ul",
        items: [
          [seg.b("Your website"), seg.t(" (first impression, clarity, speed on mobile)")],
          [seg.b(TERMS.gbp), seg.t(" — hours, photos, services")],
          [
            seg.t("Key "),
            seg.b("social profiles"),
            seg.t(" if customers expect them in your industry"),
          ],
          [
            seg.t("Basic technical health (e.g. "),
            seg.b(TERMS.pageSpeed),
            seg.t(") that affects credibility"),
          ],
        ],
      },
      {
        type: "callout",
        tone: "tip",
        segments: [
          seg.b("Non-technical read:"),
          seg.t(" If a page feels slow, broken, or outdated on your phone, your customers notice too."),
        ],
      },
    ],
    why: [
      {
        type: "p",
        segments: [
          seg.b("This is what people judge in the first few seconds"),
          seg.t(" of visiting you online."),
        ],
      },
      {
        type: "ol",
        items: [
          [seg.t("A confusing site → fewer form fills and calls")],
          [
            seg.t("An incomplete "),
            seg.b(TERMS.gbp),
            seg.t(" → fewer map clicks and directions"),
          ],
          [
            seg.t("A slow mobile experience → people leave before they read your offer"),
          ],
        ],
      },
      {
        type: "p",
        segments: [
          seg.b("Fixing presence often costs less than buying more traffic"),
          seg.t(" — because you stop leaking visitors you already earned."),
        ],
      },
    ],
  },
  revenue_funnel: {
    what: [
      {
        type: "p",
        segments: [
          seg.t("This tab answers: "),
          seg.b("“If someone is interested, can they easily take the next step?”"),
        ],
      },
      { type: "p", segments: [seg.b("We review:")] },
      {
        type: "ul",
        items: [
          [seg.b("Landing pages"), seg.t(" and main offers")],
          [seg.b(TERMS.cta), seg.t(" (book, call, quote, buy)")],
          [seg.t("Whether messaging matches ")],
          [seg.b("what you promise in ads or search"),
          seg.t(" if you run paid traffic")],
          [seg.t("Obvious blockers (buried phone number, vague pricing, dead forms)")],
        ],
      },
      {
        type: "callout",
        tone: "tip",
        segments: [
          seg.t("Look for "),
          seg.b("one clear primary action"),
          seg.t(" per page — more than one often means fewer conversions."),
        ],
      },
    ],
    why: [
      {
        type: "p",
        segments: [
          seg.b("Traffic without a clear path to action wastes money and referrals."),
        ],
      },
      {
        type: "ul",
        items: [
          [
            seg.t("Improving the funnel often delivers "),
            seg.a("faster returns"),
            seg.t(" than chasing more visibility alone."),
          ],
          [seg.b("Small copy and layout fixes"), seg.t(" can lift leads without a full rebrand.")],
          [
            seg.t("If you run ads, funnel gaps mean you pay for clicks that "),
            seg.b("never convert"),
          ],
        ],
      },
      {
        type: "callout",
        tone: "important",
        segments: [
          seg.b("Think of this tab as your checkout line"),
          seg.t(" — it doesn’t matter how many people enter the store if they can’t pay."),
        ],
      },
    ],
  },
  competitive_context: {
    what: [
      {
        type: "p",
        segments: [
          seg.t("This tab shows "),
          seg.b("how you stack up"),
          seg.t(" against nearby or direct competitors — not guaranteed rankings, but "),
          seg.b("relative footing"),
          seg.t("."),
        ],
      },
      { type: "p", segments: [seg.b("Typical comparisons:")] },
      {
        type: "ul",
        items: [
          [seg.b("Visibility"), seg.t(" (who shows up more often in search)")],
          [seg.b("Reviews"), seg.t(" (volume and ratings)")],
          [seg.b("Positioning"), seg.t(" (offers, niches, perceived specialty)")],
        ],
      },
      {
        type: "ol",
        items: [
          [
            seg.t("See where you’re "),
            seg.b("ahead"),
            seg.t(" — protect those strengths"),
          ],
          [
            seg.t("See where you’re "),
            seg.b("behind"),
            seg.t(" — prioritize fixes that buyers actually notice"),
          ],
          [seg.t("Ignore “nice to have” gaps that don’t change a buying decision")],
        ],
      },
    ],
    why: [
      {
        type: "p",
        segments: [
          seg.b("Buyers compare you to alternatives"),
          seg.t(" whether you track competitors or not."),
        ],
      },
      {
        type: "ul",
        items: [
          [
            seg.t("Knowing where you lag helps you choose "),
            seg.b("what to fix first"),
            seg.t(" for differentiation."),
          ],
          [
            seg.a("You don’t need to beat everyone everywhere"),
            seg.t(" — focus on the 1–2 gaps that cost you the most deals."),
          ],
        ],
      },
      {
        type: "callout",
        tone: "important",
        segments: [
          seg.b("Use this section to decide priorities,"),
          seg.t(" not to obsess over every competitor metric."),
        ],
      },
    ],
  },
  action_plan: {
    what: [
      {
        type: "p",
        segments: [
          seg.t("This tab turns the report into a "),
          seg.b("simple to-do list"),
          seg.t(" you can hand to your team."),
        ],
      },
      { type: "p", segments: [seg.b("Organized by timeframe:")] },
      {
        type: "ol",
        items: [
          [seg.b("This week"), seg.t(" — quick wins and urgent fixes")],
          [seg.b("This month"), seg.t(" — meaningful improvements")],
          [seg.b("This quarter"), seg.t(" — larger projects")],
        ],
      },
      {
        type: "p",
        segments: [
          seg.t("Each item ties back to findings elsewhere and includes "),
          seg.b("who should own it"),
          seg.t(" and a "),
          seg.b("rough time estimate"),
          seg.t("."),
        ],
      },
      {
        type: "callout",
        tone: "tip",
        segments: [
          seg.b("Start at the top of “This week”"),
          seg.t(" — don’t try to do everything at once."),
        ],
      },
    ],
    why: [
      {
        type: "p",
        segments: [
          seg.b("A report only helps if something changes on Monday."),
        ],
      },
      {
        type: "ul",
        items: [
          [
            seg.t("Without a ordered backlog, findings feel like "),
            seg.b("a pile of problems"),
            seg.t(" instead of a plan."),
          ],
          [
            seg.t("Timeframes help you balance "),
            seg.b("owner bandwidth"),
            seg.t(" with business impact."),
          ],
          [
            seg.a("Share this tab"),
            seg.t(" with whoever handles marketing, web, or operations."),
          ],
        ],
      },
      {
        type: "callout",
        tone: "important",
        segments: [
          seg.b("Diagnostic only:"),
          seg.t(" LevelStack lists what to fix — you or your team execute the work."),
        ],
      },
    ],
  },
}

export function getSectionGuide(tabId: string): SectionGuide | undefined {
  return SECTION_GUIDES[tabId]
}

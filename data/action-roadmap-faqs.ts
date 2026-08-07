export type ActionRoadmapFaq = {
  id: string
  question: string
  answer: string
  /** Optional deep link shown after the answer (e.g. paid sample). */
  linkHref?: string
  linkLabel?: string
}

/** In-app subset of COPY_BANK §7.1 (FAQ-07/08 live on hub waitlist pages). */
export const ACTION_ROADMAP_FAQS: ActionRoadmapFaq[] = [
  {
    id: "faq-01",
    question: "What am I actually buying for $97?",
    answer:
      "Your Action Roadmap: prioritized fixes with Who/Time/Impact, copy-paste meta rewrites, competitive benchmark, and 90-day blueprint on your dashboard — sorted to your intake goal. PDF included.",
  },
  {
    id: "faq-00",
    question: "Why isn't this called a report?",
    answer:
      "A report describes problems. An Action Roadmap gives prioritized fixes, copy-paste assets, and competitive context you can execute this week — that's what $97 buys.",
  },
  {
    id: "faq-02",
    question: "What is the $97 SEO Automator Pro waitlist credit?",
    answer:
      "Action Roadmap buyers who join the SEO Automator Pro waitlist with the same email as purchase get the assessment fee credited 100% to the first subscription month at founding rate (Solo $49; Agency $99 — as low as $2 with credit).",
  },
  {
    id: "faq-03",
    question: "What is the 100% Risk-Free Charter Guarantee?",
    answer:
      "Secure your Action Roadmap for $97; priority waitlist; assessment fee credits at SAP onboarding; dashboard live immediately.",
  },
  {
    id: "faq-04",
    question: "What's inside the Action Roadmap?",
    answer:
      "Who owns each fix, time to fix, impact level, copy-paste replacements, and unlocked modules (reputation, funnel audit, competitive context, 90-day blueprint). Prefer to see the format first? Open the sample Action Roadmap — illustrative data for a sample business.",
    linkHref: "/sample-report/action-roadmap",
    linkLabel: "See a sample Action Roadmap",
  },
  {
    id: "faq-05",
    question: "Why does paid intake ask about my goal, competitor, and contract value?",
    answer:
      "Those inputs personalize blueprint order, rival contrast, and revenue-impact lines — not generic SEO boilerplate. Paid intake only.",
  },
  {
    id: "faq-06",
    question: "What are Revenue Risks, Visibility Leaks, and Competitor Advantages?",
    answer:
      "Outcome labels on dashboard cards — business consequences, not technical jargon.",
  },
]

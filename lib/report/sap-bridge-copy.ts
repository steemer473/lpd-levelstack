// Source: lpd-planning/COPY_BANK.md §3

export type SapBridgePlacement = "freeLocked" | "fullActionPlan"

export const SAP_BRIDGE_COPY = {
  freeLocked: {
    body: "Already planning to act on what you found? The technical foundation your rankings depend on needs ongoing attention — not just a one-time fix. SEO Automator Pro monitors your site automatically so your visibility doesn't slip between audits.",
    ctaLabel: "Learn about SEO Automator Pro",
  },
  fullActionPlan: {
    body: "Your action plan tells you what to fix. Every item requires your time or someone else's. The technical SEO layer is the one part that doesn't have to be manual. SEO Automator Pro monitors it continuously and corrects issues automatically, so your rankings don't slip while you're focused on everything else your action plan requires.",
    ctaLabel: "Join the Waitlist — from $49/mo Founding Rate",
  },
} as const satisfies Record<SapBridgePlacement, { body: string; ctaLabel: string }>

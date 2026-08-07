import type { RecommendationObject } from "@/lib/pipeline/recommendation-types"

export const PRIORITY_HINTS: Record<
  RecommendationObject["priority"],
  { label: string; detail: string }
> = {
  P0: {
    label: "P0 — do this week",
    detail:
      "Highest urgency. Fix first — usually a trust or visibility gap that can block leads now.",
  },
  P1: {
    label: "P1 — this month",
    detail:
      "High priority. Schedule soon after P0 items; still material to conversion or credibility.",
  },
  P2: {
    label: "P2 — this quarter",
    detail:
      "Important but not blocking. Plan inside your 90-day roadmap after P0/P1 work.",
  },
  P3: {
    label: "P3 — backlog",
    detail:
      "Lower urgency. Keep visible, but do not let it delay P0/P1 fixes.",
  },
}

export const CONFIDENCE_HINT =
  "How sure we are about this finding from the public checks we ran. High = direct, fresh evidence. Medium = some checks were thin or unavailable. Low = limited evidence — treat as a lead, not a certainty."

export const ROI_HINT =
  "Directional value only — not a guaranteed dollar return. “Risk reduction” means plugging a trust or visibility leak. “Upside” means a clearer path to more clicks or leads."

export const IMPACT_HINT =
  "Relative business effect of fixing this gap — high, medium, or low. Not a dollar guarantee. High usually means a trust or visibility leak that can block leads now."

export const EFFORT_HINT =
  "Rough time band from the estimate on the card. Low ≈ an hour or less. Medium ≈ up to about three hours. High = a larger block of work."

export const OWNER_HINT =
  "Who should run this task — you, a freelancer, marketing, ops, or an agency."

export const TIME_HINT =
  "Rough duration estimate for the work — not a calendar deadline."

export const ACTION_NUMBER_HINT =
  "Order in the full roadmap list. Start at the top of This week and work down."

export const TIMEFRAME_HINT =
  "This week = urgent fixes (P0). This month = meaningful improvements (P1). This quarter = larger projects (P2+)."

export function priorityHint(priority: RecommendationObject["priority"]) {
  return PRIORITY_HINTS[priority]
}

export const PIPELINE_STEPS = [
  {
    id: "search_footprint",
    label: "Search footprint review",
    order: 0,
  },
  {
    id: "online_reputation",
    label: "Online reputation review",
    order: 1,
  },
  {
    id: "digital_presence",
    label: "Digital presence gap analysis",
    order: 2,
  },
  {
    id: "revenue_funnel",
    label: "Revenue funnel diagnosis",
    order: 3,
  },
  {
    id: "competitive_context",
    label: "Competitive context snapshot",
    order: 4,
  },
  {
    id: "action_plan",
    label: "Prioritized action plan",
    order: 5,
  },
] as const

export type PipelineStepId = (typeof PIPELINE_STEPS)[number]["id"]

export const PIPELINE_STEP_IDS: PipelineStepId[] = PIPELINE_STEPS.map((s) => s.id)

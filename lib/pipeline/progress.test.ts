import { describe, expect, it } from "vitest"

import {
  auditProgressPercent,
  operationCountForTier,
  pipelineStepsForTier,
  sectionProgressFromOps,
} from "@/lib/pipeline/progress"

describe("sectionProgressFromOps", () => {
  it("maps free tier 4 ops to 2 sections", () => {
    const steps = pipelineStepsForTier("free_snapshot")
    expect(steps).toHaveLength(2)
    expect(steps.map((s) => s.id)).toEqual(["search_footprint", "social_offsite"])

    expect(sectionProgressFromOps(0, "free_snapshot")).toEqual({
      currentStep: "search_footprint",
      completedSteps: [],
    })

    expect(sectionProgressFromOps(2, "free_snapshot")).toEqual({
      currentStep: "social_offsite",
      completedSteps: ["search_footprint"],
    })

    expect(sectionProgressFromOps(4, "free_snapshot")).toEqual({
      currentStep: "social_offsite",
      completedSteps: ["search_footprint"],
    })
  })

  it("maps paid tier 6 ops to 7 sections", () => {
    const steps = pipelineStepsForTier("full_report")
    expect(steps).toHaveLength(7)

    expect(sectionProgressFromOps(1, "full_report")).toEqual({
      currentStep: "social_offsite",
      completedSteps: ["search_footprint"],
    })

    expect(sectionProgressFromOps(6, "full_report")).toEqual({
      currentStep: "action_plan",
      completedSteps: [
        "search_footprint",
        "social_offsite",
        "online_reputation",
        "digital_presence",
        "revenue_funnel",
        "competitive_context",
      ],
    })
  })
})

describe("auditProgressPercent", () => {
  it("scales to 85% when all ops complete", () => {
    expect(auditProgressPercent(4, "free_snapshot")).toBe(85)
    expect(auditProgressPercent(6, "full_report")).toBe(85)
  })
})

describe("operationCountForTier", () => {
  it("returns correct op counts", () => {
    expect(operationCountForTier("free_snapshot")).toBe(4)
    expect(operationCountForTier("full_report")).toBe(6)
  })
})

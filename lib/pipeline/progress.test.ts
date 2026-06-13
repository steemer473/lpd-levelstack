import { describe, expect, it } from "vitest"

import {
  auditProgressPercent,
  operationCountForTier,
  pipelineStepsForTier,
  sectionProgressFromOps,
} from "@/lib/pipeline/progress"

describe("sectionProgressFromOps", () => {
  it("maps free tier 5 ops to 3 sections", () => {
    const steps = pipelineStepsForTier("free_snapshot")
    expect(steps).toHaveLength(3)

    expect(sectionProgressFromOps(0, "free_snapshot")).toEqual({
      currentStep: "search_footprint",
      completedSteps: [],
    })

    expect(sectionProgressFromOps(2, "free_snapshot")).toEqual({
      currentStep: "online_reputation",
      completedSteps: ["search_footprint"],
    })

    expect(sectionProgressFromOps(5, "free_snapshot")).toEqual({
      currentStep: "digital_presence",
      completedSteps: ["search_footprint", "online_reputation"],
    })
  })

  it("maps paid tier 6 ops to 6 sections", () => {
    const steps = pipelineStepsForTier("full_report")
    expect(steps).toHaveLength(6)

    expect(sectionProgressFromOps(1, "full_report")).toEqual({
      currentStep: "online_reputation",
      completedSteps: ["search_footprint"],
    })

    expect(sectionProgressFromOps(6, "full_report")).toEqual({
      currentStep: "action_plan",
      completedSteps: [
        "search_footprint",
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
    expect(auditProgressPercent(5, "free_snapshot")).toBe(85)
    expect(auditProgressPercent(6, "full_report")).toBe(85)
  })
})

describe("operationCountForTier", () => {
  it("returns correct op counts", () => {
    expect(operationCountForTier("free_snapshot")).toBe(5)
    expect(operationCountForTier("full_report")).toBe(6)
  })
})

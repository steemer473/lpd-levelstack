import { describe, expect, it } from "vitest"

import { SAMPLE_REPORT } from "@/lib/fixtures/sample-report"
import type { RecommendationObject } from "@/lib/pipeline/recommendation-types"
import { levelstackReportJsonSchema } from "@/lib/pipeline/report-types"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import {
  bucketRecommendations,
  hasRecommendations,
  priorityActionsFromReport,
  sortRecommendations,
  teaserRecommendations,
} from "@/lib/report/roadmap-from-recommendations"

function makeRec(
  overrides: Partial<RecommendationObject> &
    Pick<RecommendationObject, "id" | "title" | "priority">,
): RecommendationObject {
  return {
    summary: "Summary",
    evidence: [],
    confidence: {
      band: "Medium",
      rationale: "test",
      methodologyRef: "docs/plans/confidence-methodology.md",
    },
    roi: { kind: "risk_reduction", rangeLabel: "Moderate" },
    dependencies: { recommendationIds: [] },
    owner: { role: "business_owner" },
    automatability: { automatable: false },
    artifact: { kind: "none" },
    urgency: "Act soon",
    consequenceOfInaction: "Risk grows",
    ...overrides,
  }
}

const baseActionPlan = {
  thisWeek: [
    { task: "Legacy week task", who: "You", time: "1h" },
  ],
  thisMonth: [] as LevelstackReportJson["actionPlan"]["thisMonth"],
  thisQuarter: [] as LevelstackReportJson["actionPlan"]["thisQuarter"],
}

describe("roadmap-from-recommendations", () => {
  it("hasRecommendations is false when missing or empty", () => {
    expect(hasRecommendations({})).toBe(false)
    expect(hasRecommendations({ recommendations: [] })).toBe(false)
    expect(
      hasRecommendations({
        recommendations: [makeRec({ id: "a", title: "A", priority: "P0" })],
      }),
    ).toBe(true)
  })

  it("sorts by priority then id", () => {
    const sorted = sortRecommendations([
      makeRec({ id: "rec_b", title: "B", priority: "P1" }),
      makeRec({ id: "rec_z", title: "Z", priority: "P0" }),
      makeRec({ id: "rec_a", title: "A", priority: "P0" }),
      makeRec({ id: "rec_c", title: "C", priority: "P3" }),
    ])
    expect(sorted.map((r) => r.id)).toEqual([
      "rec_a",
      "rec_z",
      "rec_b",
      "rec_c",
    ])
  })

  it("buckets P0/P1/P2+P3 into week/month/quarter", () => {
    const buckets = bucketRecommendations([
      makeRec({ id: "p2", title: "P2", priority: "P2" }),
      makeRec({ id: "p0", title: "P0", priority: "P0" }),
      makeRec({ id: "p3", title: "P3", priority: "P3" }),
      makeRec({ id: "p1", title: "P1", priority: "P1" }),
    ])
    expect(buckets.week.map((r) => r.id)).toEqual(["p0"])
    expect(buckets.month.map((r) => r.id)).toEqual(["p1"])
    expect(buckets.quarter.map((r) => r.id)).toEqual(["p2", "p3"])
  })

  it("teaserRecommendations caps at 3 titles from recommendations", () => {
    const report = {
      meta: { teaserActionCount: 7 } as LevelstackReportJson["meta"],
      actionPlan: baseActionPlan,
      recommendations: [
        makeRec({ id: "1", title: "One", priority: "P0" }),
        makeRec({ id: "2", title: "Two", priority: "P0" }),
        makeRec({ id: "3", title: "Three", priority: "P1" }),
        makeRec({ id: "4", title: "Four", priority: "P1" }),
      ],
    }
    const teaser = teaserRecommendations(report, 3)
    expect(teaser.titles).toEqual(["One", "Two", "Three"])
    expect(teaser.count).toBe(7)
  })

  it("teaserRecommendations falls back to actionPlan when no recommendations", () => {
    const report = {
      meta: {} as LevelstackReportJson["meta"],
      actionPlan: {
        ...baseActionPlan,
        thisWeek: [
          { task: "Fix GBP", who: "You", time: "1h" },
          { task: "Rewrite bio", who: "You", time: "2h" },
        ],
      },
    }
    const teaser = teaserRecommendations(report, 3)
    expect(teaser.titles).toEqual(["Fix GBP", "Rewrite bio"])
  })

  it("priorityActionsFromReport prefers P0/P1 recommendations", () => {
    const report = {
      actionPlan: baseActionPlan,
      recommendations: [
        makeRec({
          id: "1",
          title: "Urgent",
          priority: "P0",
          effortHint: "30m",
          roi: { kind: "upside", rangeLabel: "High" },
        }),
        makeRec({ id: "2", title: "Soon", priority: "P1" }),
        makeRec({ id: "3", title: "Later", priority: "P2" }),
      ],
    }
    const actions = priorityActionsFromReport(report)
    expect(actions.map((a) => a.title)).toEqual(["Urgent", "Soon"])
    expect(actions[0]?.effortHint).toBe("30m")
    expect(actions[0]?.impactLabel).toBe("High")
  })

  it("SAMPLE_REPORT includes recommendations that parse and teaser to 3", () => {
    const parsed = levelstackReportJsonSchema.safeParse(SAMPLE_REPORT)
    expect(parsed.success).toBe(true)
    expect(hasRecommendations(SAMPLE_REPORT)).toBe(true)
    const teaser = teaserRecommendations(SAMPLE_REPORT, 3)
    expect(teaser.titles).toHaveLength(3)
    expect(teaser.titles[0]).toContain("Respond to both negative")
  })
})

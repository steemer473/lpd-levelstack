import { describe, expect, it } from "vitest"

import {
  mapActionItemToRecommendation,
  mapFindingToRecommendationSkeleton,
  priorityFromSeverity,
} from "@/lib/pipeline/map-to-recommendation"
import {
  CONFIDENCE_METHODOLOGY_REF,
  evidenceItemSchema,
  recommendationObjectSchema,
} from "@/lib/pipeline/recommendation-types"
import {
  levelstackReportJsonSchema,
  type ReportActionItem,
  type ReportFinding,
} from "@/lib/pipeline/report-types"

const sampleFinding: ReportFinding = {
  label: "Missing from page 1",
  value: "Not found",
  detail: "Brand query does not show your site in the top 10.",
  severity: "high",
  headline: "Claim your brand search",
}

const sampleAction: ReportActionItem = {
  task: "Fix brand SERP presence",
  sub: "Ensure homepage ranks for your business name.",
  who: "You",
  time: "2–4 hrs",
  automatorFlag: true,
  automatorProduct: "seo",
  artifact: "Checklist: title, NAP, GBP link",
}

function minimalReport(extras: Record<string, unknown> = {}) {
  return {
    meta: {
      businessName: "Test Co",
      ownerName: "Alex",
      marketLabel: "Atlanta, GA",
      reportDate: "2026-07-19",
      planId: null,
      overallScore: 70,
      letterGrade: "C",
      totalFindings: 1,
      criticalCount: 0,
      highCount: 1,
      mediumCount: 0,
      lowCount: 0,
    },
    executiveSummary: {
      paragraphs: ["Overview."],
      criticalIssue: "Brand search gap.",
      firstSteps: ["Fix SERP."],
    },
    sections: [
      {
        id: "search_footprint",
        label: "Search Footprint",
        status: "attention",
        score: 62,
        findings: [sampleFinding],
      },
    ],
    actionPlan: {
      thisWeek: [sampleAction],
      thisMonth: [],
      thisQuarter: [],
    },
    ...extras,
  }
}

describe("recommendationObjectSchema", () => {
  it("parses a full valid Recommendation Object", () => {
    const obj = {
      id: "rec_search_footprint_claim_brand",
      title: "Claim your brand search",
      summary: "Brand query does not show your site.",
      evidence: [
        {
          sourceType: "serp_organic",
          sourceLabel: "Google search",
          capturedAt: "2026-07-19T12:00:00.000Z",
          query: "Test Co Atlanta",
          url: "https://www.google.com/search?q=Test+Co",
          freshnessClass: "fresh",
        },
      ],
      confidence: {
        band: "High",
        rationale: "Direct fresh SERP citation; checks ok/negative.",
        methodologyRef: CONFIDENCE_METHODOLOGY_REF,
      },
      priority: "P1",
      roi: {
        kind: "risk_reduction",
        rangeLabel: "Directional — fewer lost brand clicks",
      },
      dependencies: { recommendationIds: [] },
      owner: { role: "business_owner" },
      automatability: { automatable: true, lpdProduct: "seo" },
      artifact: { kind: "checklist", content: "Update title + GBP" },
      urgency: "Prospects are choosing competitors on brand search now.",
      consequenceOfInaction: "Continued brand traffic leakage.",
      sourceSectionId: "search_footprint",
      effortHint: "2–4 hrs",
    }

    const parsed = recommendationObjectSchema.safeParse(obj)
    expect(parsed.success).toBe(true)
  })

  it("allows empty evidence with Low confidence", () => {
    const obj = mapFindingToRecommendationSkeleton(sampleFinding, {
      sectionId: "search_footprint",
    })
    expect(obj.evidence).toEqual([])
    expect(obj.confidence.band).toBe("Low")
    const parsed = recommendationObjectSchema.safeParse(obj)
    expect(parsed.success).toBe(true)
  })

  it("rejects invalid evidence sourceType", () => {
    const bad = evidenceItemSchema.safeParse({
      sourceType: "not_a_source",
      sourceLabel: "X",
      capturedAt: "2026-07-19T12:00:00.000Z",
      freshnessClass: "fresh",
    })
    expect(bad.success).toBe(false)
  })

  it("rejects invalid confidence band", () => {
    const bad = recommendationObjectSchema.safeParse({
      ...mapFindingToRecommendationSkeleton(sampleFinding, {
        sectionId: "search_footprint",
      }),
      confidence: {
        band: "VeryHigh",
        rationale: "nope",
        methodologyRef: CONFIDENCE_METHODOLOGY_REF,
      },
    })
    expect(bad.success).toBe(false)
  })
})

describe("levelstackReportJsonSchema + recommendations", () => {
  it("accepts fixtures without recommendations", () => {
    const parsed = levelstackReportJsonSchema.safeParse(minimalReport())
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.recommendations).toBeUndefined()
    }
  })

  it("accepts fixtures with recommendations", () => {
    const rec = mapActionItemToRecommendation(sampleAction, {
      sectionId: "search_footprint",
      finding: sampleFinding,
    })
    const parsed = levelstackReportJsonSchema.safeParse(
      minimalReport({ recommendations: [rec] }),
    )
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.recommendations).toHaveLength(1)
      expect(parsed.data.recommendations?.[0]?.id).toBe(rec.id)
    }
  })
})

describe("map-to-recommendation", () => {
  it("maps severity to priority", () => {
    expect(priorityFromSeverity("critical")).toBe("P0")
    expect(priorityFromSeverity("high")).toBe("P1")
    expect(priorityFromSeverity("medium")).toBe("P2")
    expect(priorityFromSeverity("low")).toBe("P3")
    expect(priorityFromSeverity("good")).toBe("P3")
  })

  it("produces schema-valid output from finding + action item", () => {
    const rec = mapActionItemToRecommendation(sampleAction, {
      sectionId: "search_footprint",
      finding: sampleFinding,
      dependencyIds: ["rec_other"],
    })
    const parsed = recommendationObjectSchema.safeParse(rec)
    expect(parsed.success).toBe(true)
    expect(rec.title).toBe(sampleAction.task)
    expect(rec.priority).toBe("P1")
    expect(rec.owner.role).toBe("business_owner")
    expect(rec.automatability).toEqual({
      automatable: true,
      lpdProduct: "seo",
    })
    expect(rec.effortHint).toBe("2–4 hrs")
    expect(rec.dependencies.recommendationIds).toEqual(["rec_other"])
    expect(rec.confidence.methodologyRef).toBe(CONFIDENCE_METHODOLOGY_REF)
    expect(rec.artifact.kind).toBe("checklist")
  })
})

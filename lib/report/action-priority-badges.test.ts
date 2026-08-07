import { describe, expect, it } from "vitest"

import {
  badgesForActionItem,
  badgesForPriorityAction,
  badgesForRecommendation,
  effortLevelFromHint,
  impactLevelFromLabel,
  priorityCodeForBucket,
} from "@/lib/report/action-priority-badges"

describe("impactLevelFromLabel", () => {
  it("maps High / Moderate / Low", () => {
    expect(impactLevelFromLabel("High")).toBe("high")
    expect(impactLevelFromLabel("Moderate")).toBe("medium")
    expect(impactLevelFromLabel("Medium")).toBe("medium")
    expect(impactLevelFromLabel("Low")).toBe("low")
  })

  it("defaults to medium when missing", () => {
    expect(impactLevelFromLabel(undefined)).toBe("medium")
    expect(impactLevelFromLabel("")).toBe("medium")
  })
})

describe("effortLevelFromHint", () => {
  it("classifies short minutes as low", () => {
    expect(effortLevelFromHint("30 min")).toBe("low")
    expect(effortLevelFromHint("15 min")).toBe("low")
    expect(effortLevelFromHint("45 min")).toBe("low")
  })

  it("classifies mid-range hours as medium", () => {
    expect(effortLevelFromHint("2 hrs")).toBe("medium")
    expect(effortLevelFromHint("2–3 hrs")).toBe("medium")
  })

  it("classifies longer durations as high", () => {
    expect(effortLevelFromHint("4–6 hrs")).toBe("high")
    expect(effortLevelFromHint("4–8 hrs")).toBe("high")
    expect(effortLevelFromHint("10–15 hrs")).toBe("high")
  })

  it("defaults to medium when unparseable", () => {
    expect(effortLevelFromHint(undefined)).toBe("medium")
    expect(effortLevelFromHint("TBD")).toBe("medium")
  })
})

describe("priorityCodeForBucket", () => {
  it("maps week/month/quarter to P0/P1/P2", () => {
    expect(priorityCodeForBucket("week")).toBe("P0")
    expect(priorityCodeForBucket("month")).toBe("P1")
    expect(priorityCodeForBucket("quarter")).toBe("P2")
  })
})

describe("badgesForActionItem", () => {
  it("defaults week impact to high and uses time for effort", () => {
    const badges = badgesForActionItem({ bucket: "week", time: "30 min" })
    expect(badges).toEqual({
      impact: "high",
      effort: "low",
      priorityCode: "P0",
    })
  })

  it("uses impactLabel when provided", () => {
    const badges = badgesForActionItem({
      bucket: "month",
      time: "4–6 hrs",
      impactLabel: "Low",
    })
    expect(badges.impact).toBe("low")
    expect(badges.effort).toBe("high")
    expect(badges.priorityCode).toBe("P1")
  })
})

describe("badgesForRecommendation", () => {
  it("derives from roi and effortHint", () => {
    const badges = badgesForRecommendation({
      priority: "P0",
      effortHint: "30 min",
      roi: { kind: "risk_reduction", rangeLabel: "High" },
    })
    expect(badges).toEqual({
      impact: "high",
      effort: "low",
      priorityCode: "P0",
    })
  })
})

describe("badgesForPriorityAction", () => {
  it("defaults P0 without impactLabel to high impact", () => {
    const badges = badgesForPriorityAction({
      priority: "P0",
      effortHint: "15 min",
    })
    expect(badges.impact).toBe("high")
    expect(badges.effort).toBe("low")
    expect(badges.priorityCode).toBe("P0")
  })

  it("uses impactLabel when present", () => {
    const badges = badgesForPriorityAction({
      priority: "P1",
      effortHint: "2 hrs",
      impactLabel: "Moderate",
    })
    expect(badges.impact).toBe("medium")
    expect(badges.effort).toBe("medium")
  })
})

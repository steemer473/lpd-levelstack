import { describe, expect, it } from "vitest"

import {
  findingBulletsForDisplay,
  findingHeadlineForDisplay,
  flagLabel,
  severityPillClass,
  severityToFlag,
} from "@/lib/report/display-helpers"
import { formatRoiLine } from "@/lib/report/outcome-copy"

describe("display-helpers outcome adapters", () => {
  it("derives headline from legacy finding.value when headline missing", () => {
    const finding = {
      label: "Test",
      value: "Legacy headline",
      detail: "Detail line one. Detail line two.",
      severity: "high" as const,
    }
    expect(findingHeadlineForDisplay(finding)).toBe("Legacy headline")
  })

  it("prefers explicit headline when present", () => {
    const finding = {
      label: "Test",
      value: "Legacy headline",
      headline: "Outcome headline",
      detail: "Detail",
      severity: "high" as const,
    }
    expect(findingHeadlineForDisplay(finding)).toBe("Outcome headline")
  })

  it("splits legacy detail into bullets", () => {
    const finding = {
      label: "Test",
      value: "Headline",
      detail: "First point.\nSecond point.",
      severity: "medium" as const,
    }
    const bullets = findingBulletsForDisplay(finding)
    expect(bullets.length).toBeGreaterThan(0)
  })

  it("maps outcome severity to badge label", () => {
    expect(flagLabel("revenue risk")).toBe("Revenue Risk")
    expect(flagLabel("visibility leak")).toBe("Visibility Leak")
  })

  it("maps severity to flag kind and pill classes", () => {
    expect(severityToFlag("good")).toBe("good")
    expect(severityToFlag("low")).toBe("good")
    expect(severityToFlag("medium")).toBe("attention")
    expect(severityToFlag("high")).toBe("critical")
    expect(severityToFlag("critical")).toBe("critical")

    expect(severityPillClass("good")).toContain("bg-green-100")
    expect(severityPillClass("good")).toContain("text-green-800")
    expect(severityPillClass("low")).toContain("bg-green-100")
    expect(severityPillClass("medium")).toContain("bg-amber-100")
    expect(severityPillClass("high")).toContain("bg-red-100")
    expect(severityPillClass("critical")).toContain("bg-red-100")
  })
})

describe("formatRoiLine", () => {
  it("returns null when tier absent", () => {
    expect(formatRoiLine("")).toBeNull()
    expect(formatRoiLine("invalid")).toBeNull()
  })

  it("returns conditional ROI copy for valid tier", () => {
    const line = formatRoiLine("500_2500")
    expect(line).toContain("18,000")
    expect(line).toContain("could represent roughly")
  })
})

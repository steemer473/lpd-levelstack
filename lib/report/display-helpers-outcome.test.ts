import { describe, expect, it } from "vitest"

import {
  findingBulletsForDisplay,
  findingHeadlineForDisplay,
  flagLabel,
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

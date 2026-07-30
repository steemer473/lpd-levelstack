import { describe, expect, it } from "vitest"

import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import {
  levelstackIntakeDefaults,
  levelstackIntakeTestDefaults,
} from "@/lib/intake/schema"
import { validatePaidIntakeForPipeline } from "./paid-intake-gate"

const validPaidIntake = {
  ...levelstackIntakeTestDefaults,
  primaryService: "Marketing automation consulting",
  pricePoint: "$3k–$10k/month",
  ownerName: "Stephanie Danielle Ragsdale",
  businessVertical: "consulting_b2b" as const,
  marketCity: "Atlanta",
  geoMarket: "local" as const,
}

describe("validatePaidIntakeForPipeline", () => {
  it("allows free snapshot tier with placeholders", () => {
    expect(
      validatePaidIntakeForPipeline(
        {
          ...levelstackIntakeDefaults,
          primaryService: "General business services",
          ownerName: "Level Play Digital",
        } as unknown as LevelstackIntakeFormValues,
        "free_snapshot",
      ).ok,
    ).toBe(true)
  })

  it("blocks paid tier when primary service is a placeholder", () => {
    const result = validatePaidIntakeForPipeline(
      {
        ...validPaidIntake,
        primaryService: "General business services",
      },
      "full_report",
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toMatch(/primary service/i)
    }
  })

  it("blocks paid tier when owner name equals business name", () => {
    const result = validatePaidIntakeForPipeline(
      {
        ...validPaidIntake,
        ownerName: validPaidIntake.primaryBusinessName,
      },
      "full_report",
    )
    expect(result.ok).toBe(false)
  })

  it("passes valid paid intake", () => {
    expect(validatePaidIntakeForPipeline(validPaidIntake, "full_report").ok).toBe(
      true,
    )
  })
})

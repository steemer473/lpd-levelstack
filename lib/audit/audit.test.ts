import { describe, expect, it } from "vitest"

import { letterGradeFromScore, statusToPercent } from "@/lib/audit/types"
import { freeSnapshotToIntake } from "@/lib/intake/free-snapshot-schema"

describe("audit types", () => {
  it("maps signal status to percent", () => {
    expect(statusToPercent("pass")).toBe(100)
    expect(statusToPercent("warning")).toBe(50)
    expect(statusToPercent("fail")).toBe(0)
  })

  it("assigns letter grades with +/- modifiers", () => {
    const cases: Array<[number, string]> = [
      [100, "A+"],
      [97, "A+"],
      [96, "A"],
      [93, "A"],
      [92, "A-"],
      [90, "A-"],
      [89, "B+"],
      [87, "B+"],
      [86, "B"],
      [83, "B"],
      [82, "B-"],
      [80, "B-"],
      [79, "C+"],
      [77, "C+"],
      [76, "C"],
      [73, "C"],
      [72, "C-"],
      [70, "C-"],
      [69, "D+"],
      [67, "D+"],
      [66, "D"],
      [63, "D"],
      [62, "D-"],
      [60, "D-"],
      [59, "F"],
      [55, "F"],
      [0, "F"],
    ]
    for (const [score, grade] of cases) {
      expect(letterGradeFromScore(score), `score ${score}`).toBe(grade)
    }
  })

  it("rounds non-integer scores before grading", () => {
    expect(letterGradeFromScore(89.6)).toBe("A-") // rounds to 90
    expect(letterGradeFromScore(76.4)).toBe("C") // rounds to 76
  })
})

describe("freeSnapshotToIntake", () => {
  it("maps free form to pipeline intake", () => {
    const intake = freeSnapshotToIntake({
      email: "test@example.com",
      businessName: "Acme Co",
      websiteUrl: "https://acme.com",
      marketCity: "Atlanta",
    })
    expect(intake.primaryBusinessName).toBe("Acme Co")
    expect(intake.websiteUrl).toBe("https://acme.com")
    expect(intake.geoMarket).toBe("local")
  })
})

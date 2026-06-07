import { describe, expect, it } from "vitest"

import { splitFullName } from "@/lib/ghl/split-name"

describe("splitFullName", () => {
  it("splits first and last name", () => {
    expect(splitFullName("Jane Doe")).toEqual({ firstName: "Jane", lastName: "Doe" })
  })

  it("uses Lead as last name for single word", () => {
    expect(splitFullName("Acme")).toEqual({ firstName: "Acme", lastName: "Lead" })
  })

  it("handles multi-part last names", () => {
    expect(splitFullName("Mary Jane Watson")).toEqual({
      firstName: "Mary",
      lastName: "Jane Watson",
    })
  })

  it("returns defaults for empty input", () => {
    expect(splitFullName("")).toEqual({ firstName: "LevelStack", lastName: "Lead" })
    expect(splitFullName("   ")).toEqual({ firstName: "LevelStack", lastName: "Lead" })
  })
})

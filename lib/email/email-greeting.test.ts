import { describe, expect, it } from "vitest"

import {
  firstNameFromOwnerName,
  formatEmailGreeting,
  resolveRecipientFirstName,
} from "@/lib/email/email-greeting"

describe("email-greeting", () => {
  it("derives first name from owner name", () => {
    expect(firstNameFromOwnerName("Tanya Smith")).toBe("Tanya")
  })

  it("formats personalized greeting", () => {
    expect(formatEmailGreeting("Tanya")).toBe("Hello, Tanya")
  })

  it("falls back to Hello when name is blank", () => {
    expect(formatEmailGreeting("")).toBe("Hello")
    expect(resolveRecipientFirstName(undefined, undefined)).toBe("")
  })

  it("prefers recipientFirstName over ownerName", () => {
    expect(resolveRecipientFirstName("Alex", "Jane Doe")).toBe("Alex")
    expect(resolveRecipientFirstName(undefined, "Jane Doe")).toBe("Jane")
  })
})

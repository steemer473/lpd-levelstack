import { describe, expect, it } from "vitest"

import { extractSocialUrls } from "@/lib/research/social"

describe("extractSocialUrls", () => {
  it("parses multiple profile URLs from intake text", () => {
    const urls = extractSocialUrls(
      "Instagram: https://instagram.com/acme\nLinkedIn https://www.linkedin.com/in/jane",
    )
    expect(urls.length).toBe(2)
    expect(urls[0]?.platform).toBe("Instagram")
    expect(urls[1]?.platform).toBe("LinkedIn")
  })
})

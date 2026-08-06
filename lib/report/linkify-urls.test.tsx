import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import { linkifyText, sanitizeHttpUrl } from "@/lib/report/linkify-urls"

describe("sanitizeHttpUrl", () => {
  it("accepts https URLs", () => {
    expect(sanitizeHttpUrl("https://linkedin.com/company/acme")).toBe(
      "https://linkedin.com/company/acme",
    )
  })

  it("rejects non-http schemes", () => {
    expect(sanitizeHttpUrl("javascript:alert(1)")).toBeNull()
  })
})

describe("linkifyText", () => {
  it("wraps http(s) URLs as anchors", () => {
    const html = renderToStaticMarkup(
      <>{linkifyText("Found at https://facebook.com/acme and done.")}</>,
    )
    expect(html).toContain('href="https://facebook.com/acme"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain("rel=\"noopener noreferrer\"")
    expect(html).toContain("Found at ")
    expect(html).toContain(" and done.")
  })

  it("keeps trailing punctuation outside the link", () => {
    const html = renderToStaticMarkup(
      <>{linkifyText("See https://example.com/path.")}</>,
    )
    expect(html).toContain('href="https://example.com/path"')
    expect(html).toMatch(/<\/a>\./)
  })

  it("leaves text without URLs unchanged", () => {
    expect(linkifyText("No links here")).toBe("No links here")
  })
})

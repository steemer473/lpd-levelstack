import { describe, expect, it } from "vitest"

import { emailLayout } from "@/lib/email/email-layout"

describe("emailLayout", () => {
  it("includes hosted PNG logo, LevelStack wordmark, and signature", () => {
    const html = emailLayout({
      title: "Test email",
      preheader: "Preview text",
      body: "<p>Hello</p>",
    })

    expect(html).toContain("https://levelplaydigital.com/images/logo.png")
    expect(html).toContain('alt="Level Play Digital"')
    expect(html).toContain("LevelStack")
    expect(html).toContain("by Level Play Digital")
    expect(html).toContain("Sincerely,")
    expect(html).toContain("Level Play Digital Customer Success Team")
    expect(html).toContain("<p>Hello</p>")
  })

  it("escapes title and preheader HTML", () => {
    const html = emailLayout({
      title: 'Test <script>alert("x")</script>',
      preheader: 'Preview & "quoted"',
      body: "<p>Body</p>",
    })

    expect(html).toContain("Test &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;")
    expect(html).toContain("Preview &amp; &quot;quoted&quot;")
    expect(html).not.toContain("<script>alert")
  })
})

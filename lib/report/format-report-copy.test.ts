import { describe, expect, it } from "vitest"

import {
  joinReportCopyParagraphs,
  splitReportCopyParagraphs,
  truncateReportCopy,
} from "@/lib/report/format-report-copy"

describe("format-report-copy", () => {
  it("splits explicit paragraph breaks", () => {
    expect(splitReportCopyParagraphs("First paragraph.\n\nSecond paragraph.")).toEqual([
      "First paragraph.",
      "Second paragraph.",
    ])
  })

  it("splits multi-sentence prose into separate paragraphs", () => {
    const paragraphs = splitReportCopyParagraphs(
      "Sentence one. Sentence two. Sentence three.",
    )
    expect(paragraphs).toHaveLength(3)
    expect(paragraphs[0]).toBe("Sentence one.")
  })

  it("does not split on periods inside URLs", () => {
    expect(
      splitReportCopyParagraphs(
        "Your site is at www.example.com in Atlanta. Findings are based on live search.",
      ),
    ).toEqual([
      "Your site is at www.example.com in Atlanta.",
      "Findings are based on live search.",
    ])
  })

  it("drops truncated trailing fragments from display paragraphs", () => {
    const raw =
      'Findings are based on live search. Example from research: When someone searches "Platinum Real Estate", Google surfaces other businesses first (contactplatinum.com, platinumrealestatenj.com, realtor.com). Your domain (platinumrealestate.com) w'

    expect(splitReportCopyParagraphs(raw)).toEqual([
      "Findings are based on live search.",
      'Example from research: When someone searches "Platinum Real Estate", Google surfaces other businesses first (contactplatinum.com, platinumrealestatenj.com, realtor.com).',
    ])
  })

  it("truncates long copy at sentence boundaries", () => {
    const detail =
      'When someone searches "Platinum Real Estate" without a location, Google surfaces other similarly named businesses first (contactplatinum.com, platinumrealestatenj.com, realtor.com). Your domain (platinumrealestate.com) was not in the top 10.'

    expect(truncateReportCopy(detail, 220)).toBe(
      'When someone searches "Platinum Real Estate" without a location, Google surfaces other similarly named businesses first (contactplatinum.com, platinumrealestatenj.com, realtor.com).',
    )
  })

  it("joins paragraphs with blank lines", () => {
    expect(joinReportCopyParagraphs(["A", "B"])).toBe("A\n\nB")
  })
})

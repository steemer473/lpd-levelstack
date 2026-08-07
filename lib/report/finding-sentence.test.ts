import { describe, expect, it } from "vitest"

import { composeFindingSentence } from "@/lib/report/finding-sentence"

describe("composeFindingSentence", () => {
  it("composes personal-name complaint finding into a complete sentence", () => {
    const sentence = composeFindingSentence(
      "search_footprint",
      'Google page 1 — "Marcus Carter" (personal name)',
      "3rd result: complaint post on ConsumerAffairs.com",
    )
    expect(sentence).toBe(
      "When prospects search your name (“Marcus Carter”), the third result on Google page 1 is a complaint post on ConsumerAffairs.com.",
    )
  })

  it("composes service-rank finding with competitor clause", () => {
    const sentence = composeFindingSentence(
      "search_footprint",
      'Google page 1 — "MC Fitness Atlanta" (primary service)',
      "Your website ranks #4. Competitors in positions 1–3.",
    )
    expect(sentence).toBe(
      "Your website ranks fourth on Google page 1 for “MC Fitness Atlanta,” with competitors holding the top three positions.",
    )
  })

  it("composes Google Business Profile review metrics", () => {
    const sentence = composeFindingSentence(
      "online_reputation",
      "Google Business Profile reviews",
      "3.2★ from 6 reviews — 2 unanswered negatives",
    )
    expect(sentence).toBe(
      "Your Google Business Profile shows 3.2 stars from 6 reviews, and 2 negative reviews have gone unanswered.",
    )
  })

  it("composes paid traffic destination shorthand", () => {
    const sentence = composeFindingSentence(
      "revenue_funnel",
      "Paid traffic destination",
      "$1,200/mo ads → services page with no social proof",
    )
    expect(sentence).toBe(
      "You spend $1,200 a month on ads that land on a services page with no social proof.",
    )
  })

  it("composes Instagram follower gap", () => {
    const sentence = composeFindingSentence(
      "social_offsite",
      "Instagram (intake)",
      "2,400 followers · Last post 91 days ago",
    )
    expect(sentence).toBe(
      "Your Instagram account has 2,400 followers, but the last post was 91 days ago.",
    )
  })

  it("composes competitive not-in-top finding", () => {
    const sentence = composeFindingSentence(
      "competitive_context",
      'Service search — "online fitness coach Atlanta"',
      "You: not in top 3. ATL Fit Pro #1 organic. FitLife Atlanta #2.",
    )
    expect(sentence).toMatch(/^You do not appear in the top three results for “online fitness coach Atlanta”\./)
    expect(sentence).toMatch(/ATL Fit Pro holds the first organic position/)
    expect(sentence).toMatch(/FitLife Atlanta holds the second organic position/)
  })

  it("preserves already-complete sentences with terminal punctuation", () => {
    const sentence = composeFindingSentence(
      "social_offsite",
      "Facebook",
      "No Facebook profile found in search",
    )
    expect(sentence).toMatch(/\.$/)
    expect(sentence.length).toBeGreaterThan(10)
  })

  it("composes LinkedIn profile-found fragment", () => {
    const sentence = composeFindingSentence(
      "social_offsite",
      "LinkedIn",
      "Company profile found in search",
    )
    expect(sentence).toBe("LinkedIn shows a company profile in search.")
  })

  it("keeps AI platform name in the headline", () => {
    const sentence = composeFindingSentence(
      "search_footprint",
      "Google AI Overview",
      'Query "personal trainer Atlanta online" surfaces an AI Overview with 4 citations.',
    )
    expect(sentence).toMatch(/^Google AI Overview:/)
    expect(sentence).toMatch(/surfaces an AI Overview/)
  })
})

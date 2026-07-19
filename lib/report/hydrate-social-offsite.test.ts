import { describe, expect, it } from "vitest"

import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import {
  ensureSocialOffsiteSection,
  hydrateMissingSocialOffsite,
  sectionMissingFromReport,
} from "@/lib/report/hydrate-social-offsite"

const baseMeta = {
  businessName: "Test Co",
  ownerName: "Alex",
  marketLabel: "Atlanta, GA",
  reportDate: "July 19, 2026",
  planId: "levelstack-full-report",
  reportTier: "full_report" as const,
  overallScore: 70,
  letterGrade: "C" as const,
  totalFindings: 2,
  criticalCount: 0,
  highCount: 1,
  mediumCount: 1,
  lowCount: 0,
}

const paidWithoutSocial: LevelstackReportJson = {
  meta: baseMeta,
  executiveSummary: {
    paragraphs: ["Intro"],
    criticalIssue: "Gap",
    firstSteps: [],
  },
  sections: [
    {
      id: "search_footprint",
      label: "Search footprint",
      status: "attention",
      score: 50,
      findings: [
        {
          label: "Brand",
          value: "Weak brand SERP",
          detail: "Detail",
          severity: "high",
        },
      ],
    },
    {
      id: "digital_presence",
      label: "Digital presence",
      status: "attention",
      score: 60,
      findings: [
        {
          label: "LinkedIn",
          value: "No clear LinkedIn profile matched",
          detail: "Search miss",
          severity: "high",
        },
        {
          label: "Page speed",
          value: "Slow mobile",
          detail: "LCP high",
          severity: "medium",
        },
      ],
    },
  ],
  actionPlan: { thisWeek: [], thisMonth: [], thisQuarter: [] },
}

describe("hydrateMissingSocialOffsite", () => {
  it("is a no-op when social_offsite already exists", () => {
    const withSocial = hydrateMissingSocialOffsite({
      ...paidWithoutSocial,
      sections: [
        ...paidWithoutSocial.sections,
        {
          id: "social_offsite",
          label: "Social & off-site presence",
          status: "good",
          score: 80,
          findings: [
            {
              label: "Facebook",
              value: "Found",
              detail: "ok",
              severity: "good",
            },
          ],
        },
      ],
    })
    expect(withSocial.sections.filter((s) => s.id === "social_offsite")).toHaveLength(1)
  })

  it("hydrates from free snapshot backup", () => {
    const free: LevelstackReportJson = {
      ...paidWithoutSocial,
      meta: { ...baseMeta, reportTier: "free_snapshot" },
      sections: [
        {
          id: "social_offsite",
          label: "Social & off-site presence",
          status: "attention",
          score: 55,
          findings: [
            {
              label: "Facebook",
              value: "No clear Facebook profile matched your brand in search",
              detail: "Nothing matched",
              severity: "high",
            },
          ],
        },
      ],
    }
    const hydrated = hydrateMissingSocialOffsite(paidWithoutSocial, free)
    const social = hydrated.sections.find((s) => s.id === "social_offsite")
    expect(social?.findings[0]?.value).toContain("Facebook")
    expect(sectionMissingFromReport(hydrated, "social_offsite")).toBe(false)
  })

  it("synthesizes from digital_presence social findings when no free backup", () => {
    const hydrated = hydrateMissingSocialOffsite(paidWithoutSocial, null)
    const social = hydrated.sections.find((s) => s.id === "social_offsite")
    expect(social).toBeTruthy()
    expect(social?.findings.some((f) => /LinkedIn/i.test(f.label))).toBe(true)
    expect(social?.findings.some((f) => /Page speed/i.test(f.label))).toBe(false)
  })
})

describe("ensureSocialOffsiteSection", () => {
  it("inserts baseline social when missing", () => {
    const baseline = [
      {
        id: "social_offsite",
        label: "Social & off-site presence",
        status: "attention" as const,
        score: 40,
        findings: [
          {
            label: "Social platforms",
            value: "Not completed",
            detail: "n/a",
            severity: "medium" as const,
          },
        ],
      },
    ]
    const next = ensureSocialOffsiteSection(paidWithoutSocial.sections, baseline)
    expect(next.some((s) => s.id === "social_offsite")).toBe(true)
  })
})

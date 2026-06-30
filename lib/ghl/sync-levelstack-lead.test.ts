import { afterEach, describe, expect, it, vi } from "vitest"

import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"

vi.mock("@/lib/ghl/ghl-api", () => ({
  createGHLContact: vi.fn(),
}))

vi.mock("@/lib/urls", () => ({
  getAppUrl: (path: string) => `https://levelstack.test${path}`,
}))

import { createGHLContact } from "@/lib/ghl/ghl-api"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import {
  buildReportCompleteCustomFields,
  syncFreeSnapshotLead,
  syncPaidIntakeLead,
  syncReportCompleteEnrichment,
} from "@/lib/ghl/sync-levelstack-lead"

const mockedCreateGHLContact = vi.mocked(createGHLContact)

const paidFormData: LevelstackIntakeFormValues = {
  primaryBusinessName: "Acme Coaching",
  marketCity: "Austin",
  marketState: "TX",
  priorBusinessNames: ["None"],
  ownerName: "Jane Doe",
  primaryService: "Executive coaching",
  pricePoint: "$3,000",
  ninetyDayGoal: "calls",
  contractValueTier: "2500_10000",
  hasActiveAdSpend: "no",
  adPlatforms: "",
  adBudget: "",
  websiteUrl: "https://example.com",
  socialProfiles: "LinkedIn: jane",
  emailListSize: "500",
  geoMarket: "local",
  complaintsAwareness: "None known",
  reputationSelfAssessment: "Generally positive",
  reputationScale: 7,
  purchaseMotivation: "Low conversion from ads",
  topCompetitorUrl: "Acme Rival",
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("syncFreeSnapshotLead", () => {
  it("maps free snapshot fields to GHL contact payload", async () => {
    mockedCreateGHLContact.mockResolvedValue({
      contact: { id: "ghl-1", email: "jane@example.com", firstName: "Acme", lastName: "Lead" },
    })

    const result = await syncFreeSnapshotLead({
      email: "Jane@Example.com",
      businessName: "Acme Coaching",
      websiteUrl: "https://example.com",
      marketCity: "Austin",
      reportId: "report-123",
    })

    expect(result).toEqual({ success: true, contactId: "ghl-1" })
    expect(mockedCreateGHLContact).toHaveBeenCalledWith({
      firstName: "Acme",
      lastName: "Coaching",
      email: "jane@example.com",
      companyName: "Acme Coaching",
      source: "LevelStack Free Snapshot",
      tags: ["levelstack", "levelstack_free_snapshot"],
      customFields: {
        website_url: "https://example.com",
        intake_source: "levelstack_free_snapshot",
        levelstack_report_url: "https://levelstack.test/reports/report-123",
        market_city: "Austin",
      },
    })
  })

  it("returns error when GHL is not configured", async () => {
    mockedCreateGHLContact.mockResolvedValue(null)

    const result = await syncFreeSnapshotLead({
      email: "jane@example.com",
      businessName: "Acme",
      websiteUrl: "https://example.com",
      reportId: "report-123",
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain("not configured")
  })
})

describe("syncPaidIntakeLead", () => {
  it("maps paid intake fields to GHL contact payload", async () => {
    mockedCreateGHLContact.mockResolvedValue({
      contact: { id: "ghl-2", email: "jane@example.com", firstName: "Jane", lastName: "Doe" },
    })

    const result = await syncPaidIntakeLead({
      email: "jane@example.com",
      ownerName: "Jane Doe",
      formData: paidFormData,
      planId: "levelstack-full-report",
      reportId: "report-456",
    })

    expect(result).toEqual({ success: true, contactId: "ghl-2" })
    expect(mockedCreateGHLContact).toHaveBeenCalledWith({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      companyName: "Acme Coaching",
      source: "LevelStack Paid Intake",
      tags: ["levelstack", "levelstack_paid_intake", "levelstack-full-report"],
      customFields: {
        website_url: "https://example.com",
        intake_source: "levelstack_paid_intake",
        levelstack_report_url: "https://levelstack.test/reports/report-456",
        primary_service: "Executive coaching",
        purchase_motivation: "Low conversion from ads",
        geo_focus: "local",
        market_city: "Austin",
        ninety_day_goal: "calls",
        contract_value_tier: "2500_10000",
        levelstack_paid_amount: "97",
        top_competitor: "Acme Rival",
      },
    })
  })
})

const reportJsonFixture: LevelstackReportJson = {
  meta: {
    businessName: "Acme Coaching",
    ownerName: "Jane Doe",
    marketLabel: "Austin, TX",
    reportDate: "2026-06-26",
    planId: "levelstack-free-snapshot",
    reportTier: "free_snapshot",
    overallScore: 62,
    letterGrade: "C",
    totalFindings: 5,
    criticalCount: 1,
    highCount: 2,
    mediumCount: 1,
    lowCount: 1,
    upgradeTeasers: {
      previewCompetitor: {
        rank: 1,
        domain: "modomodoagency.com",
        title: "Modo Modo Agency",
      },
    },
  },
  executiveSummary: {
    paragraphs: ["Prospects see gaps"],
    criticalIssue: "Not in top 10 for primary service search",
    firstSteps: ["Fix homepage CTA"],
  },
  sections: [],
  actionPlan: {
    thisWeek: [{ task: "Fix CTA", who: "Owner", time: "1 hour" }],
    thisMonth: [],
    thisQuarter: [],
  },
}

describe("syncReportCompleteEnrichment", () => {
  it("maps report-complete fields to GHL contact payload", async () => {
    mockedCreateGHLContact.mockResolvedValue({
      contact: { id: "ghl-3", email: "jane@example.com", firstName: "LevelStack", lastName: "Report Ready" },
    })

    const result = await syncReportCompleteEnrichment({
      email: "Jane@Example.com",
      reportId: "report-789",
      reportTier: "free_snapshot",
      reportJson: reportJsonFixture,
      topFinding: "Missing Google Business Profile",
      accessUrl: "https://levelstack.test/reports/report-789/access?token=abc",
    })

    expect(result).toEqual({ success: true, contactId: "ghl-3" })
    expect(mockedCreateGHLContact).toHaveBeenCalledWith({
      firstName: "LevelStack",
      lastName: "Report Ready",
      email: "jane@example.com",
      source: "LevelStack Report Complete",
      tags: ["levelstack", "levelstack_report_ready", "levelstack_report_ready_free_snapshot"],
      customFields: {
        levelstack_report_url: "https://levelstack.test/reports/report-789/access?token=abc",
        report_tier: "free_snapshot",
        top_competitor: "modomodoagency.com",
        top_finding: "Missing Google Business Profile",
      },
    })
  })

  it("falls back to executive criticalIssue when topFinding is absent", () => {
    const fields = buildReportCompleteCustomFields({
      email: "jane@example.com",
      reportId: "report-789",
      reportTier: "free_snapshot",
      reportJson: reportJsonFixture,
    })

    expect(fields.top_finding).toBe("Not in top 10 for primary service search")
    expect(fields.levelstack_report_url).toBe("https://levelstack.test/reports/report-789")
  })

  it("omits top_competitor when preview competitor is missing", async () => {
    mockedCreateGHLContact.mockResolvedValue({
      contact: { id: "ghl-4", email: "jane@example.com", firstName: "LevelStack", lastName: "Report Ready" },
    })

    const reportWithoutCompetitor: LevelstackReportJson = {
      ...reportJsonFixture,
      meta: {
        ...reportJsonFixture.meta,
        upgradeTeasers: undefined,
      },
    }

    await syncReportCompleteEnrichment({
      email: "jane@example.com",
      reportId: "report-789",
      reportTier: "full_report",
      reportJson: reportWithoutCompetitor,
      topFinding: "Weak homepage CTA",
    })

    expect(mockedCreateGHLContact).toHaveBeenCalledWith(
      expect.objectContaining({
        customFields: {
          levelstack_report_url: "https://levelstack.test/reports/report-789",
          report_tier: "full_report",
          levelstack_sap_credit_eligible: "yes",
          top_finding: "Weak homepage CTA",
        },
      }),
    )
  })

  it("returns error when GHL is not configured", async () => {
    mockedCreateGHLContact.mockResolvedValue(null)

    const result = await syncReportCompleteEnrichment({
      email: "jane@example.com",
      reportId: "report-789",
      reportTier: "free_snapshot",
      reportJson: reportJsonFixture,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain("not configured")
  })
})

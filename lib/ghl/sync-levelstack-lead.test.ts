import { afterEach, describe, expect, it, vi } from "vitest"

import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"

vi.mock("@/lib/ghl/ghl-api", () => ({
  createGHLContact: vi.fn(),
}))

vi.mock("@/lib/urls", () => ({
  getAppUrl: (path: string) => `https://levelstack.test${path}`,
}))

import { createGHLContact } from "@/lib/ghl/ghl-api"
import { syncFreeSnapshotLead, syncPaidIntakeLead } from "@/lib/ghl/sync-levelstack-lead"

const mockedCreateGHLContact = vi.mocked(createGHLContact)

const paidFormData: LevelstackIntakeFormValues = {
  primaryBusinessName: "Acme Coaching",
  marketCity: "Austin",
  marketState: "TX",
  priorBusinessNames: ["None"],
  ownerName: "Jane Doe",
  primaryService: "Executive coaching",
  pricePoint: "$3,000",
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
      },
    })
  })
})

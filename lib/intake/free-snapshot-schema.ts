import { z } from "zod"

import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"

function normalizeWebsiteUrl(value: unknown): unknown {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export const freeSnapshotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  businessName: z.string().min(1, "Business name is required"),
  websiteUrl: z.preprocess(
    normalizeWebsiteUrl,
    z.string().url("Enter a valid website URL"),
  ),
  marketCity: z.string().optional(),
})

export type FreeSnapshotFormValues = z.infer<typeof freeSnapshotSchema>

export const freeSnapshotDefaults: FreeSnapshotFormValues = {
  email: "",
  businessName: "",
  websiteUrl: "",
  marketCity: "",
}

/** Map free snapshot fields to minimal full intake for the research pipeline. */
export function freeSnapshotToIntake(
  free: FreeSnapshotFormValues,
): LevelstackIntakeFormValues {
  return {
    primaryBusinessName: free.businessName.trim(),
    marketCity: free.marketCity?.trim() ?? "",
    marketState: "",
    priorBusinessNames: ["None"],
    ownerName: free.businessName.trim(),
    primaryService: "General business services",
    pricePoint: "Not specified",
    hasActiveAdSpend: "no",
    adPlatforms: "",
    adBudget: "",
    websiteUrl: free.websiteUrl,
    socialProfiles: "Not provided — discovered via research",
    emailListSize: "Unknown",
    geoMarket: free.marketCity?.trim() ? "local" : "national",
    complaintsAwareness: "Not specified",
    reputationSelfAssessment: "Not specified",
    reputationScale: 5,
    purchaseMotivation: "Free snapshot audit",
  }
}

import { z } from "zod"

import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"

export function normalizeWebsiteUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function isValidWebsiteUrl(value: string): boolean {
  try {
    const url = new URL(normalizeWebsiteUrl(value))
    return ["http:", "https:"].includes(url.protocol)
  } catch {
    return false
  }
}

export const freeSnapshotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  businessName: z.string().min(1, "Business name is required"),
  websiteUrl: z
    .string()
    .min(1, "Website URL is required")
    .refine(isValidWebsiteUrl, { message: "Enter a valid website URL" }),
  marketCity: z.string().optional(),
})

export type FreeSnapshotFormValues = z.infer<typeof freeSnapshotSchema>

export const freeSnapshotDefaults: FreeSnapshotFormValues = {
  email: "",
  businessName: "",
  websiteUrl: "",
  marketCity: "",
}

/** Normalize website URL after schema validation (e.g. prepend https://). */
export function parseFreeSnapshotInput(
  data: FreeSnapshotFormValues,
): FreeSnapshotFormValues {
  return {
    ...data,
    websiteUrl: normalizeWebsiteUrl(data.websiteUrl),
  }
}

/** Map free snapshot fields to minimal full intake for the research pipeline. */
export function freeSnapshotToIntake(
  free: FreeSnapshotFormValues,
): LevelstackIntakeFormValues {
  const websiteUrl = normalizeWebsiteUrl(free.websiteUrl)

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
    websiteUrl,
    socialProfiles: "Not provided — discovered via research",
    emailListSize: "Unknown",
    geoMarket: free.marketCity?.trim() ? "local" : "national",
    complaintsAwareness: "Not specified",
    reputationSelfAssessment: "Not specified",
    reputationScale: 5,
    purchaseMotivation: "Free snapshot audit",
  }
}

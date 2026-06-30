import { z } from "zod"

export const geoMarketOptions = ["local", "regional", "national"] as const
export const ninetyDayGoalOptions = [
  "calls",
  "reputation",
  "website",
  "ads",
] as const
export const contractValueTierOptions = [
  "under_500",
  "500_2500",
  "2500_10000",
  "10000_plus",
] as const

function normalizeWebsiteUrl(value: unknown): unknown {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function normalizeCompetitorInput(value: unknown): unknown {
  if (typeof value !== "string") return value
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (!/\s/.test(trimmed) && /\./.test(trimmed)) return `https://${trimmed}`
  return trimmed
}

export const levelstackIntakeSchema = z
  .object({
  primaryBusinessName: z.string().min(1, "Primary business name is required"),
  /** City or metro where this business operates — disambiguates common names (e.g. franchise brands). */
  marketCity: z.string().optional(),
  /** Optional state / province (recommended for US local businesses). */
  marketState: z.string().optional(),
  priorBusinessNames: z
    .array(z.string().min(1, "Enter a name or remove empty rows"))
    .min(1, "Add at least one prior name entry (use “None” if not applicable)"),
  ownerName: z.string().min(1, "Owner / personal brand name is required"),
  primaryService: z.string().min(1, "Primary service or offer is required"),
  /**
   * Optional concise search phrase (2–5 words) prospects would actually Google,
   * e.g. "marketing operations software". Used for the competitive/service SERP
   * when the verbose `primaryService` would return a low-signal page.
   */
  primaryServiceKeywords: z.string().optional(),
  pricePoint: z.string().min(1, "Current price point is required"),
  ninetyDayGoal: z.enum(ninetyDayGoalOptions).optional(),
  contractValueTier: z.enum(contractValueTierOptions).optional(),
  hasActiveAdSpend: z.enum(["yes", "no"]),
  adPlatforms: z.string().optional(),
  adBudget: z.string().optional(),
  websiteUrl: z.preprocess(
    normalizeWebsiteUrl,
    z.string().url("Enter a valid website URL (e.g. https://example.com)"),
  ),
  socialProfiles: z.string().min(1, "List active social profiles"),
  emailListSize: z.string().min(1, "Approximate email list size is required"),
  geoMarket: z.enum(geoMarketOptions),
  complaintsAwareness: z.string().min(1, "Required"),
  reputationSelfAssessment: z.string().min(1, "Required"),
  reputationScale: z.coerce.number().int().min(1).max(10),
  purchaseMotivation: z.string().min(1, "Tell us what prompted your purchase"),
  /** Optional known competitor website — used when live SERP has no peer domains. */
  topCompetitorUrl: z.preprocess(
    normalizeCompetitorInput,
    z.union([z.string().url(), z.string().min(1), z.literal("")]).optional(),
  ),
})
  .superRefine((data, ctx) => {
    if (
      (data.geoMarket === "local" || data.geoMarket === "regional") &&
      !data.marketCity?.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "City is required for local and regional businesses so we research the correct location.",
        path: ["marketCity"],
      })
    }
  })

export type LevelstackIntakeFormValues = z.infer<typeof levelstackIntakeSchema>

export const levelstackIntakeDefaults: LevelstackIntakeFormValues = {
  primaryBusinessName: "",
  marketCity: "",
  marketState: "",
  priorBusinessNames: [""],
  ownerName: "",
  primaryService: "",
  primaryServiceKeywords: "",
  pricePoint: "",
  ninetyDayGoal: undefined,
  contractValueTier: undefined,
  hasActiveAdSpend: "no",
  adPlatforms: "",
  adBudget: "",
  websiteUrl: "",
  socialProfiles: "",
  emailListSize: "",
  geoMarket: "local",
  complaintsAwareness: "",
  reputationSelfAssessment: "",
  reputationScale: 5,
  purchaseMotivation: "",
  topCompetitorUrl: "",
}

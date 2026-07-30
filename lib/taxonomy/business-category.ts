/**
 * P1-4 — internal business vertical taxonomy.
 * Replaces raw GBP passthrough and free-tier "General business services" placeholder
 * for category-dependent reputation and competitive logic.
 */

export const BUSINESS_CATEGORY_IDS = [
  "local_home_services",
  "healthcare_wellness",
  "legal_financial",
  "real_estate",
  "local_consumer_services",
  "marketing_agency",
  "consulting_b2b",
  "b2b_saas",
  "retail_ecommerce",
  "general_business",
] as const

export type BusinessCategoryId = (typeof BUSINESS_CATEGORY_IDS)[number]

export type BusinessCategoryClassification = {
  id: BusinessCategoryId
  /** Customer-safe label for grids and report meta. */
  label: string
  source: "gbp" | "intake" | "website" | "inferred"
  /** Raw Google Maps / GBP category when present. */
  gbpCategoryRaw: string | null
}

export type BusinessCategorySignals = {
  primaryService?: string
  primaryServiceKeywords?: string
  /** Paid intake industry picker — wins over inference when set. */
  businessVertical?: BusinessVerticalPickerId | "" | null
  gbpCategory?: string | null
  websiteTitle?: string | null
  websiteDescription?: string | null
  businessName?: string
}

/** Picker options (excludes `general_business` fallback bucket). */
export const BUSINESS_VERTICAL_PICKER_IDS = [
  "local_home_services",
  "healthcare_wellness",
  "legal_financial",
  "real_estate",
  "local_consumer_services",
  "marketing_agency",
  "consulting_b2b",
  "b2b_saas",
  "retail_ecommerce",
] as const satisfies readonly BusinessCategoryId[]

export type BusinessVerticalPickerId =
  (typeof BUSINESS_VERTICAL_PICKER_IDS)[number]

export const BUSINESS_VERTICAL_PICKER_OPTIONS: ReadonlyArray<{
  id: BusinessVerticalPickerId
  label: string
  hint: string
}> = [
  {
    id: "local_home_services",
    label: "Local home services",
    hint: "HVAC, plumbing, roofing, electrical, landscaping, pest control",
  },
  {
    id: "healthcare_wellness",
    label: "Healthcare & wellness",
    hint: "Dental, medical, chiropractic, med spa, veterinary",
  },
  {
    id: "legal_financial",
    label: "Legal & financial",
    hint: "Attorneys, CPAs, insurance agents, financial advisors",
  },
  {
    id: "real_estate",
    label: "Real estate",
    hint: "Agents, brokerages, property management, mortgage",
  },
  {
    id: "local_consumer_services",
    label: "Local consumer services",
    hint: "Salon, barber, fitness, photography, pet grooming",
  },
  {
    id: "marketing_agency",
    label: "Marketing & digital agency",
    hint: "SEO, ads, web design, creative — client-service agency",
  },
  {
    id: "consulting_b2b",
    label: "B2B consulting & systems",
    hint: "Operations, automation, systems integrator, professional B2B",
  },
  {
    id: "b2b_saas",
    label: "B2B software & SaaS",
    hint: "Software product, platform, app, MarTech vendor",
  },
  {
    id: "retail_ecommerce",
    label: "Retail & e-commerce",
    hint: "Store, boutique, shop, online retail",
  },
]

const PLACEHOLDER_SERVICES = new Set([
  "general business services",
  "not specified",
  "unknown",
])

/** SerpAPI Maps `type` may be string or string[] — normalize before trim/match. */
export function normalizeGbpCategory(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim()) return item.trim()
    }
    return null
  }
  const coerced = String(value).trim()
  return coerced || null
}

type CategoryRule = {
  id: BusinessCategoryId
  label: string
  /** Intake / website keyword patterns (case-insensitive). */
  intakePatterns: RegExp[]
  /** GBP category substring patterns. */
  gbpPatterns: RegExp[]
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    id: "local_home_services",
    label: "Local home services",
    intakePatterns: [
      /\bhvac\b/i,
      /plumb/i,
      /roof/i,
      /electric/i,
      /landscap/i,
      /pest control/i,
      /garage door/i,
      /handyman/i,
    ],
    gbpPatterns: [/hvac/i, /plumb/i, /roof/i, /contractor/i, /home service/i],
  },
  {
    id: "healthcare_wellness",
    label: "Healthcare & wellness",
    intakePatterns: [
      /dental/i,
      /dentist/i,
      /medical spa/i,
      /chiropract/i,
      /physical therap/i,
      /dermatolog/i,
      /veterinar/i,
    ],
    gbpPatterns: [/dental/i, /medical/i, /clinic/i, /doctor/i, /health/i],
  },
  {
    id: "legal_financial",
    label: "Legal & financial services",
    intakePatterns: [
      /attorney/i,
      /law firm/i,
      /\blawyer\b/i,
      /accounting/i,
      /\bcpa\b/i,
      /insurance agent/i,
      /financial advis/i,
    ],
    gbpPatterns: [/law/i, /attorney/i, /account/i, /insurance/i, /financial/i],
  },
  {
    id: "real_estate",
    label: "Real estate",
    intakePatterns: [
      /real estate/i,
      /realtor/i,
      /brokerage/i,
      /property manag/i,
      /mortgage/i,
    ],
    gbpPatterns: [/real estate/i, /realtor/i, /broker/i],
  },
  {
    id: "local_consumer_services",
    label: "Local consumer services",
    intakePatterns: [
      /salon/i,
      /barber/i,
      /fitness coach/i,
      /personal train/i,
      /photograph/i,
      /wedding/i,
      /pet groom/i,
      /daycare/i,
    ],
    gbpPatterns: [/salon/i, /spa/i, /gym/i, /fitness/i],
  },
  {
    id: "marketing_agency",
    label: "Marketing & digital agency",
    intakePatterns: [
      /marketing agency/i,
      /digital agency/i,
      /\bseo agency\b/i,
      /advertising agency/i,
      /web design agency/i,
      /creative agency/i,
    ],
    gbpPatterns: [/marketing agency/i, /advertising agency/i, /digital agency/i],
  },
  {
    id: "b2b_saas",
    label: "B2B software & SaaS",
    intakePatterns: [
      /\bsaas\b/i,
      /software platform/i,
      /\bsoftware\b/i,
      /\bapp platform\b/i,
      /cloud platform/i,
      /marketing automation platform/i,
    ],
    gbpPatterns: [/software/i, /saas/i, /technology/i],
  },
  {
    id: "consulting_b2b",
    label: "B2B consulting & systems",
    intakePatterns: [
      /consult/i,
      /systems integrat/i,
      /\bai\b/i,
      /automation/i,
      /operations/i,
      /managed service/i,
      /professional service/i,
      /b2b/i,
    ],
    gbpPatterns: [/consult/i, /business service/i, /professional service/i],
  },
  {
    id: "retail_ecommerce",
    label: "Retail & e-commerce",
    intakePatterns: [/e-?commerce/i, /online store/i, /retail/i, /boutique/i, /shop/i],
    gbpPatterns: [/store/i, /retail/i, /shop/i],
  },
]

/** Google Maps category strings → taxonomy (before raw GBP passthrough). */
const GBP_CATEGORY_ALIASES: ReadonlyArray<{
  pattern: RegExp
  categoryId: BusinessCategoryId
}> = [
  { pattern: /general contractor|\bhvac\b|plumb|roof|electrician|landscap|pest control|garage door|handyman|home service/i, categoryId: "local_home_services" },
  { pattern: /dentist|dental|orthodont|medical spa|chiropract|physical therap|dermatolog|veterinar|physician|\bclinic\b|doctor/i, categoryId: "healthcare_wellness" },
  { pattern: /attorney|law firm|\blawyer\b|\blaw\b|accountant|\bcpa\b|insurance agency|financial advis|financial planner/i, categoryId: "legal_financial" },
  { pattern: /real estate|realtor|\brealty\b|property manag|mortgage broker/i, categoryId: "real_estate" },
  { pattern: /hair salon|beauty salon|barber|nail salon|\bgym\b|fitness|personal train|photograph|pet groom|daycare|\bspa\b/i, categoryId: "local_consumer_services" },
  { pattern: /marketing agency|advertising agency|digital agency|internet marketing|web design|\bseo\b|social media agency/i, categoryId: "marketing_agency" },
  { pattern: /management consultant|business consultant|consultant|systems integrat|professional service|business service/i, categoryId: "consulting_b2b" },
  { pattern: /\bsaas\b|software company|software develop|technology company|computer software/i, categoryId: "b2b_saas" },
  { pattern: /restaurant|\bstore\b|boutique|retail|e-?commerce|online store/i, categoryId: "retail_ecommerce" },
]

function categoryLabelForId(id: BusinessCategoryId): string {
  return CATEGORY_RULES.find((r) => r.id === id)?.label ?? "General business"
}

function classificationFromPicker(
  vertical: BusinessVerticalPickerId,
  gbpRaw: string | null,
): BusinessCategoryClassification {
  return {
    id: vertical,
    label: categoryLabelForId(vertical),
    source: "intake",
    gbpCategoryRaw: gbpRaw,
  }
}

/**
 * Map messy GBP labels to taxonomy. Uses haystack for disambiguation
 * (e.g. "internet marketing" + automation → consulting, not agency).
 */
export function resolveGbpCategoryAlias(
  gbpRaw: string | null | undefined,
  haystack: string,
): BusinessCategoryId | null {
  if (!gbpRaw) return null
  const gbpLower = gbpRaw.toLowerCase()

  if (
    /internet marketing|marketing service|marketing consultant/.test(gbpLower) &&
    /automation|systems|software|platform|operations|\bconsult|\bb2b\b/i.test(haystack)
  ) {
    return "consulting_b2b"
  }

  for (const { pattern, categoryId } of GBP_CATEGORY_ALIASES) {
    if (pattern.test(gbpLower)) return categoryId
  }
  return null
}

function normalizeHaystack(signals: BusinessCategorySignals): string {
  const parts = [
    signals.primaryServiceKeywords,
    signals.primaryService,
    signals.gbpCategory,
    signals.websiteTitle,
    signals.websiteDescription,
    signals.businessName,
  ]
    .filter(Boolean)
    .join(" ")
  return parts.toLowerCase()
}

function isPlaceholderService(service: string | undefined): boolean {
  if (!service?.trim()) return true
  return PLACEHOLDER_SERVICES.has(service.trim().toLowerCase())
}

function scoreRule(rule: CategoryRule, haystack: string, gbpRaw: string | null): number {
  let score = 0
  for (const pattern of rule.intakePatterns) {
    if (pattern.test(haystack)) score += 2
  }
  if (gbpRaw) {
    const gbpLower = gbpRaw.toLowerCase()
    for (const pattern of rule.gbpPatterns) {
      if (pattern.test(gbpLower)) score += 4
    }
  }
  return score
}

/**
 * Classify a business into the internal taxonomy from intake + optional GBP/website signals.
 */
export function classifyBusinessCategory(
  signals: BusinessCategorySignals,
): BusinessCategoryClassification {
  const gbpRaw = normalizeGbpCategory(signals.gbpCategory)
  const haystack = normalizeHaystack(signals)

  const picked = signals.businessVertical
  if (picked && (BUSINESS_VERTICAL_PICKER_IDS as readonly string[]).includes(picked)) {
    return classificationFromPicker(picked as BusinessVerticalPickerId, gbpRaw)
  }

  // Messy GBP labels (e.g. "Internet marketing service") disambiguate via haystack
  // before keyword scoring so intake phrasing does not fight Google taxonomy.
  if (
    gbpRaw &&
    /internet marketing|marketing service|marketing consultant/i.test(gbpRaw)
  ) {
    const aliasId = resolveGbpCategoryAlias(gbpRaw, haystack)
    if (aliasId) {
      return {
        id: aliasId,
        label: categoryLabelForId(aliasId),
        source: "gbp",
        gbpCategoryRaw: gbpRaw,
      }
    }
  }

  let best: { rule: CategoryRule; score: number; source: BusinessCategoryClassification["source"] } | null =
    null

  for (const rule of CATEGORY_RULES) {
    const score = scoreRule(rule, haystack, gbpRaw)
    if (score === 0) continue
    const source: BusinessCategoryClassification["source"] = gbpRaw &&
      rule.gbpPatterns.some((p) => p.test(gbpRaw.toLowerCase()))
      ? "gbp"
      : signals.primaryServiceKeywords?.trim() || !isPlaceholderService(signals.primaryService)
        ? "intake"
        : signals.websiteTitle?.trim()
          ? "website"
          : "inferred"

    if (!best || score > best.score) {
      best = { rule, score, source }
    }
  }

  if (best && best.score >= 2) {
    return {
      id: best.rule.id,
      label: best.rule.label,
      source: best.source,
      gbpCategoryRaw: gbpRaw,
    }
  }

  if (gbpRaw) {
    const aliasId = resolveGbpCategoryAlias(gbpRaw, haystack)
    if (aliasId) {
      return {
        id: aliasId,
        label: categoryLabelForId(aliasId),
        source: "gbp",
        gbpCategoryRaw: gbpRaw,
      }
    }
    return {
      id: "general_business",
      label: gbpRaw,
      source: "gbp",
      gbpCategoryRaw: gbpRaw,
    }
  }

  const hasRealIntake =
    !isPlaceholderService(signals.primaryService) ||
    Boolean(signals.primaryServiceKeywords?.trim())

  return {
    id: "general_business",
    label: hasRealIntake ? "General business" : "Business category pending",
    source: hasRealIntake ? "intake" : "inferred",
    gbpCategoryRaw: null,
  }
}

/** BBB reputation checks matter for local-trust verticals, not typical B2B consultancies. */
export function shouldIncludeBbbReputationCheck(
  categoryId: BusinessCategoryId,
): boolean {
  switch (categoryId) {
    case "local_home_services":
    case "healthcare_wellness":
    case "legal_financial":
    case "real_estate":
    case "local_consumer_services":
    case "retail_ecommerce":
      return true
    case "marketing_agency":
    case "consulting_b2b":
    case "b2b_saas":
      return false
    default:
      return false
  }
}

/** Clutch / G2 / Capterra cluster is more relevant for B2B and agency buyers. */
export function prefersB2bReviewDirectories(
  categoryId: BusinessCategoryId,
): boolean {
  switch (categoryId) {
    case "marketing_agency":
    case "consulting_b2b":
    case "b2b_saas":
      return true
    default:
      return false
  }
}

/** Label shown in competitive grid — taxonomy first, GBP raw as fallback detail. */
export function displayCategoryLabel(
  classification: BusinessCategoryClassification | null | undefined,
  gbpFallback?: string | null,
): string {
  if (classification?.label) return classification.label
  const raw = gbpFallback?.trim()
  return raw || "—"
}

export function classificationFromIntake(
  intake: {
    primaryService: string
    primaryServiceKeywords?: string
    primaryBusinessName?: string
    businessVertical?: BusinessVerticalPickerId | "" | null
  },
  extra?: Omit<
    BusinessCategorySignals,
    "primaryService" | "primaryServiceKeywords" | "businessName" | "businessVertical"
  >,
): BusinessCategoryClassification {
  return classifyBusinessCategory({
    primaryService: intake.primaryService,
    primaryServiceKeywords: intake.primaryServiceKeywords,
    businessName: intake.primaryBusinessName,
    businessVertical: intake.businessVertical,
    ...extra,
  })
}

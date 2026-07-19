import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { businessNameForSearch } from "@/lib/intake/location"
import {
  classifyLimitationAvailability,
  isUnavailableSearchCheck,
  type SectionCheck,
} from "@/lib/pipeline/check-availability"
import type { ReportFinding, ReportSection } from "@/lib/pipeline/report-types"
import type { ResearchBundle } from "@/lib/pipeline/research-types"
import {
  customerLimitationText,
  UNABLE_TO_VERIFY_DETAIL,
  UNABLE_TO_VERIFY_VALUE,
} from "@/lib/report/customer-copy"
import { TERMS } from "@/lib/report/customer-terms"
import { hostnameFromUrl, type SerpSearchResponse } from "@/lib/research/serp"

export type AiOverviewCheckResult = {
  aiPreview: NonNullable<ReportSection["aiPreview"]>
  check: SectionCheck
  finding: ReportFinding
}

function normalizeMatchText(value: string): string {
  return value.trim().toLowerCase()
}

/** True when AI Overview text cites the business name or buyer domain. */
export function aiOverviewMentionsBrand(
  aiOverview: string,
  brandName: string,
  buyerHost: string | null,
): boolean {
  const text = normalizeMatchText(aiOverview)
  if (!text) return false

  const brand = normalizeMatchText(brandName)
  if (brand.length >= 3 && text.includes(brand)) return true

  if (buyerHost) {
    const host = normalizeMatchText(buyerHost)
    if (host && text.includes(host)) return true
    const bare = host.replace(/^www\./, "")
    if (bare && text.includes(bare)) return true
  }

  return false
}

function pickFootprintSearch(
  bundle: ResearchBundle,
  intake: LevelstackIntakeFormValues,
): SerpSearchResponse | null {
  const searches = bundle.searchFootprint.searches
  if (searches.length === 0) return null

  const withOverview = searches.find((s) => s.aiOverview?.trim())
  if (withOverview) return withOverview

  const businessQuery = businessNameForSearch(intake)
  return (
    searches.find((s) => s.query.toLowerCase() === businessQuery.toLowerCase()) ??
    searches.find((s) =>
      s.query.toLowerCase().includes(intake.primaryBusinessName.toLowerCase()),
    ) ??
    searches[0] ??
    null
  )
}

function previewCard(
  result: string,
  severity: ReportFinding["severity"],
): NonNullable<ReportSection["aiPreview"]>[number] {
  return {
    platform: TERMS.aiOverview,
    result,
    severity,
  }
}

/**
 * P0-2: live Google AI Overview presence check from cached brand SERP.
 * ChatGPT / Perplexity are not called — Google only.
 */
export function buildAiOverviewCheck(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
): AiOverviewCheckResult {
  const buyerHost = hostnameFromUrl(intake.websiteUrl)
  const brandName = intake.primaryBusinessName.trim()
  const search = pickFootprintSearch(bundle, intake)

  if (!search) {
    const result = UNABLE_TO_VERIFY_VALUE
    const severity = "medium" as const
    return {
      check: { availability: "not_checked", severity },
      aiPreview: [previewCard(result, severity)],
      finding: {
        label: TERMS.aiOverview,
        value: result,
        detail: UNABLE_TO_VERIFY_DETAIL,
        severity,
      },
    }
  }

  if (isUnavailableSearchCheck(search)) {
    const severity = "medium" as const
    const value = customerLimitationText(search.limitation, UNABLE_TO_VERIFY_VALUE)
    const detail = customerLimitationText(search.limitation, UNABLE_TO_VERIFY_DETAIL)
    return {
      check: {
        availability: classifyLimitationAvailability(search.limitation),
        severity,
      },
      aiPreview: [previewCard(value, severity)],
      finding: {
        label: TERMS.aiOverview,
        value,
        detail,
        severity,
      },
    }
  }

  const aiOverview = search.aiOverview?.trim() || null

  if (aiOverview) {
    const cited = aiOverviewMentionsBrand(aiOverview, brandName, buyerHost)
    if (cited) {
      const severity = "low" as const
      const value = `${TERMS.aiOverview} returned for a brand query and mentions your business.`
      return {
        check: { availability: "ok", severity },
        aiPreview: [previewCard(value, severity)],
        finding: {
          label: TERMS.aiOverview,
          value,
          detail: aiOverview.slice(0, 400),
          severity,
        },
      }
    }

    const severity = "medium" as const
    const value = `${TERMS.aiOverview} returned for a brand query, but your business was not clearly cited.`
    return {
      check: { availability: "negative", severity },
      aiPreview: [previewCard(value, severity)],
      finding: {
        label: TERMS.aiOverview,
        value,
        detail: aiOverview.slice(0, 400),
        severity,
      },
    }
  }

  const severity = "medium" as const
  const value = `No ${TERMS.aiOverview} snippet returned for footprint queries.`
  return {
    check: { availability: "negative", severity },
    aiPreview: [previewCard(value, severity)],
    finding: {
      label: TERMS.aiOverview,
      value,
      detail:
        "Google did not show an AI Overview for these brand queries. Organic results and clear entity details on your site and Google Business Profile still matter most.",
      severity,
    },
  }
}

/** Merge live Google AI Overview preview onto a section (overwrites invent/stub cards). */
export function attachAiOverviewPreview(
  section: ReportSection,
  check: AiOverviewCheckResult,
): ReportSection {
  return {
    ...section,
    aiPreview: check.aiPreview,
  }
}

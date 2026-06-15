import type { ReportTier } from "@/lib/levelstack-plans"
import { isInternalLimitation } from "@/lib/report/customer-copy"
import { researchBundleHasSerpData } from "@/lib/pipeline/serp-backed-sections"
import type { ResearchBundle } from "@/lib/pipeline/research-types"

const USER_FACING_RESEARCH_ERROR =
  "We couldn't complete live research. Try again or contact support."

export type ResearchQualityResult =
  | { ok: true }
  | { ok: false; userMessage: string; logReason: string }

function websiteFetchSucceeded(bundle: ResearchBundle): boolean {
  const website = bundle.primaryDomain.website
  if (website.title?.trim()) return true
  if (website.h1?.trim()) return true
  if (website.metaDescription?.trim()) return true
  if (website.wordCountApprox > 0) return true
  if (website.limitation && !isInternalLimitation(website.limitation)) return true
  return false
}

export function validateResearchQuality(
  bundle: ResearchBundle,
  reportTier: ReportTier,
): ResearchQualityResult {
  if (!researchBundleHasSerpData(bundle)) {
    return {
      ok: false,
      userMessage: USER_FACING_RESEARCH_ERROR,
      logReason: `[pipeline] research gate failed: no SERP data (tier=${reportTier})`,
    }
  }

  if (!websiteFetchSucceeded(bundle)) {
    return {
      ok: false,
      userMessage: USER_FACING_RESEARCH_ERROR,
      logReason: `[pipeline] research gate failed: website fetch empty (tier=${reportTier})`,
    }
  }

  return { ok: true }
}

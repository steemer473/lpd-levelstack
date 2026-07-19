import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import type { CheckAvailability } from "@/lib/pipeline/check-availability"
import { TERMS } from "@/lib/report/customer-terms"
import {
  isB2bReviewDirectoryPlatform,
  platformFromQuery,
} from "@/lib/research/reputation-parse"
import type { ResearchBundle } from "@/lib/pipeline/research-types"
import type {
  LevelstackReportJson,
  ReportFinding,
  ReportSection,
} from "@/lib/pipeline/report-types"
import {
  CONFIDENCE_METHODOLOGY_REF,
  type ConfidenceBand,
  type EvidenceItem,
  type RecommendationObject,
} from "@/lib/pipeline/recommendation-types"
import { priorityFromSeverity } from "@/lib/pipeline/map-to-recommendation"
import type { SerpOrganicResult, SerpSearchResponse } from "@/lib/research/serp"

const RECOMMENDATION_SECTION_IDS = new Set([
  "search_footprint",
  "online_reputation",
])

const SKIP_ACTION_FINDING =
  /unable to verify|not checked for this report|no platform-specific review|not fetched yet|insufficient data/i

const SEO_AUTOMATOR_KEYWORDS =
  /index|snippet|meta|google business|gbp|social|local seo|schema|visibility|search|seo|ai search/i
const WORKFLOW_AUTOMATOR_KEYWORDS =
  /workflow|process|handoff|follow-up|crm|pipeline|onboard|intake|automation|deliverable|ops/i

function automatorMatch(text: string): {
  automatable: boolean
  lpdProduct?: "seo" | "workflow"
} {
  if (WORKFLOW_AUTOMATOR_KEYWORDS.test(text)) {
    return { automatable: true, lpdProduct: "workflow" }
  }
  if (SEO_AUTOMATOR_KEYWORDS.test(text)) {
    return { automatable: true, lpdProduct: "seo" }
  }
  return { automatable: false }
}

export function isActionableRecommendationFinding(f: {
  value: string
  detail: string
  severity: string
}): boolean {
  if (SKIP_ACTION_FINDING.test(`${f.value} ${f.detail}`)) return false
  if (f.severity === "good" || f.severity === "low") return false
  return true
}

function slugPart(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40)
}

function googleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}

export type AssignConfidenceInput = {
  evidence: EvidenceItem[]
  /** Availability of checks that support this recommendation. */
  supportAvailability: CheckAvailability[]
  sectionStatus: ReportSection["status"]
}

/**
 * Rule-based confidence bands (P2-3). Pure — no LLM.
 */
export function assignConfidenceBand(
  input: AssignConfidenceInput,
): { band: ConfidenceBand; rationale: string } {
  const { evidence, supportAvailability, sectionStatus } = input

  if (sectionStatus === "insufficient_data") {
    return {
      band: "Low",
      rationale:
        "Section has insufficient data — confidence capped; do not treat as a strong claim.",
    }
  }

  const hasBlocked = supportAvailability.some(
    (a) => a === "unavailable" || a === "not_checked",
  )
  const hasUnavailable = supportAvailability.some((a) => a === "unavailable")
  const majorityBlocked =
    supportAvailability.length > 0 &&
    supportAvailability.filter(
      (a) => a === "unavailable" || a === "not_checked",
    ).length /
      supportAvailability.length >
      0.5

  const nonDerived = evidence.filter((e) => e.sourceType !== "derived")
  const hasDirect = nonDerived.length >= 1
  const allFresh =
    evidence.length > 0 && evidence.every((e) => e.freshnessClass === "fresh")
  const hasStale = evidence.some((e) => e.freshnessClass === "stale")
  const hasAging = evidence.some((e) => e.freshnessClass === "aging")
  const mostlyDerived =
    evidence.length > 0 && nonDerived.length / evidence.length < 0.5

  if (majorityBlocked || hasStale || mostlyDerived || !hasDirect) {
    return {
      band: "Low",
      rationale: hasStale
        ? "Supporting evidence is stale."
        : majorityBlocked
          ? "Majority of supporting checks were blocked or not run."
          : !hasDirect
            ? "No direct non-derived citation."
            : "Evidence is mostly derived or incomplete.",
    }
  }

  if (hasUnavailable || hasAging || !allFresh) {
    return {
      band: "Medium",
      rationale: hasUnavailable
        ? "At least one supporting check was unavailable — capped at Medium."
        : "Evidence is aging or incomplete relative to High criteria.",
    }
  }

  const allScoreable = supportAvailability.every(
    (a) => a === "ok" || a === "negative",
  )
  if (hasDirect && allFresh && allScoreable && !hasBlocked) {
    return {
      band: "High",
      rationale:
        "Direct fresh citation with checked (ok/negative) support and no blocked checks.",
    }
  }

  return {
    band: "Medium",
    rationale: "Claimable from live research but not all High criteria met.",
  }
}

function urgencyForBand(band: ConfidenceBand, title: string): string {
  switch (band) {
    case "High":
      return `Address soon: ${title.slice(0, 80)} is backed by current public evidence.`
    case "Medium":
      return `Worth scheduling: ${title.slice(0, 80)} shows a real gap, with moderate certainty.`
    default:
      return "Review when capacity allows — certainty is limited on this item."
  }
}

function consequenceForBand(band: ConfidenceBand): string {
  switch (band) {
    case "High":
      return "Leaving this open keeps a visible gap competitors can use in the same searches."
    case "Medium":
      return "The gap may continue to cost trust or clicks until verified and fixed."
    default:
      return "Gap may persist until addressed; treat as provisional until re-checked."
  }
}

function artifactForFinding(
  finding: ReportFinding,
  sectionId: string,
  intake?: LevelstackIntakeFormValues,
): RecommendationObject["artifact"] {
  const blob = `${finding.label} ${finding.value} ${finding.detail}`.toLowerCase()

  if (/snippet|meta description|what google shows/.test(blob)) {
    const biz = intake?.primaryBusinessName?.trim() || "Your business"
    const service = intake?.primaryService?.trim() || "your services"
    const market = [intake?.marketCity, intake?.marketState]
      .filter(Boolean)
      .join(", ")
    return {
      kind: "copy_rewrite",
      content: [
        `Title draft: ${biz} | ${service}${market ? ` in ${market}` : ""}`,
        `Meta draft: ${biz} helps with ${service}${market ? ` for ${market}` : ""}. Clear next step on the homepage.`,
      ].join("\n"),
    }
  }

  if (/review|rating|complaint|reputation|clutch|g2|capterra|yelp|bbb/.test(blob)) {
    if (/reply|respond|negative/.test(blob)) {
      return {
        kind: "reply_draft",
        content:
          "Thanks for the feedback — we take this seriously. Please contact us at [email] so we can make this right.",
      }
    }
    return {
      kind: "checklist",
      content: [
        "Claim or create the missing review profile",
        `Match ${TERMS.nap} to your website and ${TERMS.gbp}`,
        "Request 3–5 recent customer reviews",
        "Link the profile from your website footer",
      ].join("\n"),
    }
  }

  if (sectionId === "search_footprint" || /search|serp|ai overview|page 1/.test(blob)) {
    return {
      kind: "checklist",
      content: [
        "Confirm homepage title and main heading (H1) match your brand name",
        `Align ${TERMS.gbp} name and website URL`,
        "Add clear service + location copy on the homepage",
        "Re-check brand search after changes",
      ].join("\n"),
    }
  }

  return {
    kind: "checklist",
    content: `Fix: ${finding.value.slice(0, 120)}`,
  }
}

function roiForFinding(
  finding: ReportFinding,
  sectionId: string,
): RecommendationObject["roi"] {
  if (sectionId === "online_reputation") {
    return {
      kind: "risk_reduction",
      rangeLabel: "Risk reduction — stronger third-party proof",
    }
  }
  if (/snippet|meta/.test(`${finding.label} ${finding.value}`.toLowerCase())) {
    return {
      kind: "upside",
      rangeLabel: "Directional — clearer click-through from search",
    }
  }
  return {
    kind: "risk_reduction",
    rangeLabel: `Risk reduction — clearer brand ${TERMS.serp}`,
  }
}

function evidenceFromSerpResults(
  search: SerpSearchResponse | undefined,
  sourceType: EvidenceItem["sourceType"],
  sourceLabel: string,
  generatedAt: string,
  limit = 3,
): EvidenceItem[] {
  if (!search?.results.length) return []
  return search.results.slice(0, limit).map((r: SerpOrganicResult) => ({
    sourceType,
    sourceLabel,
    capturedAt: generatedAt,
    query: search.query,
    url: r.link || googleSearchUrl(search.query),
    rawRef: `serp:${search.query}:#${r.position}`,
    freshnessClass: "fresh" as const,
  }))
}

function evidenceForSearchFinding(
  finding: ReportFinding,
  bundle: ResearchBundle,
  generatedAt: string,
): { evidence: EvidenceItem[]; availability: CheckAvailability[] } {
  const blob = `${finding.label} ${finding.value} ${finding.detail}`.toLowerCase()
  const searches = bundle.searchFootprint.searches
  const brandSearch = searches[0]
  const ownerSearch = searches[1]

  if (/ai overview/.test(blob)) {
    const hasOverview = Boolean(brandSearch?.aiOverview)
    const evidence: EvidenceItem[] = [
      {
        sourceType: "ai_overview",
        sourceLabel: "Google AI Overview",
        capturedAt: generatedAt,
        query: brandSearch?.query,
        url: brandSearch?.query
          ? googleSearchUrl(brandSearch.query)
          : undefined,
        rawRef: "searchFootprint.searches[0].aiOverview",
        freshnessClass: "fresh",
      },
    ]
    return {
      evidence,
      availability: [hasOverview || brandSearch?.results.length ? "negative" : brandSearch?.limitation ? "unavailable" : "negative"],
    }
  }

  const useOwner = /owner|searches your name/.test(blob)
  const search = useOwner ? ownerSearch : brandSearch
  const evidence = evidenceFromSerpResults(
    search,
    "serp_organic",
    "Google search",
    generatedAt,
  )

  if (evidence.length === 0 && search?.limitation) {
    return { evidence: [], availability: ["unavailable"] }
  }

  if (evidence.length === 0) {
    // Checked gap with no organic hits to cite — still scoreable negative
    return {
      evidence: search?.query
        ? [
            {
              sourceType: "serp_organic",
              sourceLabel: "Google search",
              capturedAt: generatedAt,
              query: search.query,
              url: googleSearchUrl(search.query),
              rawRef: `serp:${search.query}:empty`,
              freshnessClass: "fresh",
            },
          ]
        : [],
      availability: ["negative"],
    }
  }

  return { evidence, availability: ["negative"] }
}

function evidenceForReputationFinding(
  finding: ReportFinding,
  bundle: ResearchBundle,
  generatedAt: string,
): { evidence: EvidenceItem[]; availability: CheckAvailability[] } {
  const isB2bCluster = /clutch\s*\/\s*g2\s*\/\s*capterra|b2b review directories/i.test(
    finding.label,
  )

  const evidence: EvidenceItem[] = []
  const availability: CheckAvailability[] = []

  for (const search of bundle.reputation.searches) {
    const platform = platformFromQuery(search.query)
    if (isB2bCluster) {
      if (!isB2bReviewDirectoryPlatform(platform)) continue
    } else if (platform) {
      const labelPlatform = finding.label.replace(/\s+visibility$/i, "")
      if (platform.toLowerCase() !== labelPlatform.toLowerCase() && !finding.label.toLowerCase().includes(platform.toLowerCase())) {
        // Prefer matching platform queries; for generic review search include all non-B2B
        if (!/review search|complaint/i.test(finding.label)) continue
      }
    }

    if (search.limitation && !search.results.length) {
      availability.push(
        /not fetched yet/i.test(search.limitation)
          ? "not_checked"
          : "unavailable",
      )
      continue
    }

    const sourceLabel = platform
      ? `Public ${platform} search results`
      : "Public review / directory search results"
    const fromResults = evidenceFromSerpResults(
      search,
      "directory_serp",
      sourceLabel,
      generatedAt,
      2,
    )
    if (fromResults.length) {
      evidence.push(...fromResults)
      availability.push("negative")
    } else if (search.query) {
      evidence.push({
        sourceType: "directory_serp",
        sourceLabel,
        capturedAt: generatedAt,
        query: search.query,
        url: googleSearchUrl(search.query),
        freshnessClass: "fresh",
      })
      availability.push("negative")
    }
  }

  if (evidence.length === 0 && availability.length === 0) {
    availability.push("negative")
  }

  return { evidence, availability }
}

function findingToRecommendation(
  finding: ReportFinding,
  section: ReportSection,
  bundle: ResearchBundle,
  generatedAt: string,
  intake?: LevelstackIntakeFormValues,
): RecommendationObject {
  const sectionId = section.id
  const { evidence, availability } =
    sectionId === "online_reputation"
      ? evidenceForReputationFinding(finding, bundle, generatedAt)
      : evidenceForSearchFinding(finding, bundle, generatedAt)

  const confidence = assignConfidenceBand({
    evidence,
    supportAvailability: availability,
    sectionStatus: section.status,
  })

  const title = finding.headline?.trim() || finding.label
  const auto = automatorMatch(
    `${finding.label} ${finding.value} ${finding.detail}`,
  )

  return {
    id: `rec_${slugPart(sectionId)}_${slugPart(finding.label) || "finding"}`,
    title,
    summary: finding.detail || finding.value,
    evidence,
    confidence: {
      band: confidence.band,
      rationale: confidence.rationale,
      methodologyRef: CONFIDENCE_METHODOLOGY_REF,
    },
    priority: priorityFromSeverity(finding.severity),
    roi: roiForFinding(finding, sectionId),
    dependencies: { recommendationIds: [] },
    owner: { role: "business_owner" },
    automatability: auto,
    artifact: artifactForFinding(finding, sectionId, intake),
    urgency: urgencyForBand(confidence.band, title),
    consequenceOfInaction: consequenceForBand(confidence.band),
    sourceSectionId: sectionId,
  }
}

export type AttachRecommendationsContext = {
  generatedAt: string
  intake?: LevelstackIntakeFormValues
}

/**
 * Dual-write Search Footprint + Reputation Recommendation Objects onto report_json.
 * Does not remove findings / actionPlan (P2-5 UI).
 */
export function attachSearchReputationRecommendations(
  report: LevelstackReportJson,
  bundle: ResearchBundle,
  ctx: AttachRecommendationsContext,
): LevelstackReportJson {
  const recommendations: RecommendationObject[] = []

  for (const section of report.sections) {
    if (!RECOMMENDATION_SECTION_IDS.has(section.id)) continue
    for (const finding of section.findings) {
      if (!isActionableRecommendationFinding(finding)) continue
      recommendations.push(
        findingToRecommendation(
          finding,
          section,
          bundle,
          ctx.generatedAt,
          ctx.intake,
        ),
      )
    }
  }

  return {
    ...report,
    recommendations,
  }
}

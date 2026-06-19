import { z } from "zod"

import type { AuditScoreBundle } from "@/lib/audit/types"
import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { businessNameForSearch, marketLocationLabel } from "@/lib/intake/location"
import { completeOpenAiJson, isOpenAiConfigured } from "@/lib/llm/openai-json"
import {
  reportSectionSchema,
  type ReportSection,
} from "@/lib/pipeline/report-types"
import type { ResearchBundle } from "@/lib/pipeline/research-types"
import { researchBundleHasSerpData } from "@/lib/pipeline/serp-backed-sections"
import { SEARCH_FOOTPRINT_FREE_PROMPT } from "@/lib/pipeline/synthesis-prompts"
import {
  businessSearchSeverity,
  ownerSearchSeverity,
} from "@/lib/pipeline/search-finding-severity"
import { TERMS } from "@/lib/report/customer-terms"
import { SNIPPET_COMPARE_SUCCESS, SNIPPET_COMPARE_UNAVAILABLE } from "@/lib/report/customer-copy"
import type { SerpOrganicResult } from "@/lib/research/serp"
import { hostnameFromUrl, resultsMentionDomain } from "@/lib/research/serp"

const SEARCH_SIGNAL_IDS = new Set([
  "google_indexing",
  "search_snippet_accuracy",
  "meta_og_completeness",
  "name_collision",
])

const llmResponseSchema = z.object({
  section: reportSectionSchema,
})

function formatTopResults(results: SerpOrganicResult[], limit = 3): string {
  return results
    .slice(0, limit)
    .map((r) => `#${r.position} ${r.title} (${r.link})`)
    .join("; ")
}

function competitorDomains(results: SerpOrganicResult[], excludeHost: string | null): string[] {
  const domains: string[] = []
  for (const row of results.slice(0, 5)) {
    try {
      const host = new URL(row.link).hostname.replace(/^www\./, "")
      if (!host || host === excludeHost?.toLowerCase()) continue
      if (!domains.includes(host)) domains.push(host)
    } catch {
      continue
    }
  }
  return domains.slice(0, 3)
}

function sectionStatusFromSignals(signals: { status: string }[]) {
  if (signals.some((s) => s.status === "fail")) return "critical" as const
  if (signals.some((s) => s.status === "warning")) return "attention" as const
  return "good" as const
}

function scoreFromSignals(signals: { status: string }[]): number {
  if (signals.length === 0) return 70
  const pts = signals.map((s) =>
    s.status === "pass" ? 100 : s.status === "warning" ? 60 : 35,
  )
  return Math.round(pts.reduce((a, b) => a + b, 0) / pts.length)
}

function signalRowsFromAudit(audit: AuditScoreBundle) {
  const searchSignals = audit.signals.filter((s) => SEARCH_SIGNAL_IDS.has(s.id))
  return searchSignals.map((s) => ({
    label: s.label,
    value: s.status.toUpperCase(),
    percent: s.status === "pass" ? 100 : s.status === "warning" ? 50 : 0,
    tone:
      s.status === "pass"
        ? ("green" as const)
        : s.status === "warning"
          ? ("amber" as const)
          : ("red" as const),
  }))
}

function compactPayload(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  audit: AuditScoreBundle,
): string {
  const slim = {
    reportDate: bundle.searchFootprint.reportDate,
    intake: {
      primaryBusinessName: intake.primaryBusinessName,
      ownerName: intake.ownerName,
      websiteUrl: intake.websiteUrl,
      market: marketLocationLabel(intake),
      geoMarket: intake.geoMarket,
      primaryService: intake.primaryService,
    },
    website: {
      title: bundle.digitalPresence.website.title,
      metaDescription: bundle.digitalPresence.website.metaDescription?.slice(0, 300),
      h1: bundle.digitalPresence.website.h1,
    },
    signals: audit.signals
      .filter((s) => SEARCH_SIGNAL_IDS.has(s.id))
      .map((s) => ({ id: s.id, label: s.label, status: s.status, finding: s.finding })),
    searches: bundle.searchFootprint.searches.map((s) => ({
      query: s.query,
      limitation: s.limitation,
      topResults: s.results.slice(0, 5).map((r) => ({
        position: r.position,
        title: r.title,
        link: r.link,
        snippet: r.snippet.slice(0, 200),
      })),
    })),
  }
  const raw = JSON.stringify(slim)
  return raw.length > 10_000 ? `${raw.slice(0, 10_000)}…[truncated]` : raw
}

/** Deterministic Search footprint section for free snapshot (no LLM). */
export function buildDeterministicSearchFootprintSection(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  audit: AuditScoreBundle,
): ReportSection {
  const buyerHost = hostnameFromUrl(intake.websiteUrl)
  const bareBrand = intake.primaryBusinessName.trim()
  const scopedQuery = businessNameForSearch(intake)
  const searchSignals = audit.signals.filter((s) => SEARCH_SIGNAL_IDS.has(s.id))

  const bareSearch = bundle.searchFootprint.searches[0]
  const scopedSearch =
    bundle.searchFootprint.searches.find(
      (s) => s.query.toLowerCase() === scopedQuery.toLowerCase(),
    ) ??
    bundle.searchFootprint.searches.find(
      (s) =>
        s !== bareSearch &&
        s.query.toLowerCase().includes(intake.primaryBusinessName.toLowerCase()),
    )

  const bareHit = bareSearch
    ? resultsMentionDomain(bareSearch.results, buyerHost)
    : null
  const scopedHit = scopedSearch
    ? resultsMentionDomain(scopedSearch.results, buyerHost)
    : null

  const ownerSearch = bundle.searchFootprint.searches.find((s) =>
    s.query.toLowerCase().includes(intake.ownerName.toLowerCase()),
  )

  const findings: ReportSection["findings"] = []

  if (!researchBundleHasSerpData(bundle)) {
    findings.push({
      label: "Search data",
      value: "Live Google search results were not available for this snapshot.",
      detail:
        "We could not retrieve search engine results page (SERP) data. Configure at least one SERP provider and regenerate the report.",
      severity: "high",
    })
  } else {
    const bareCompetitors = bareSearch?.results.length
      ? competitorDomains(bareSearch.results, buyerHost)
      : []

    findings.push({
      label: `Brand search — "${bareBrand}"`,
      value: bareHit
        ? `Your site appears around position #${bareHit.position} for this query.`
        : bareSearch?.results.length
          ? "Your website was not in the top 10 organic results for this query."
          : bareSearch?.limitation ?? "Search data unavailable for business name.",
      detail: bareSearch?.results.length
        ? [
            bareHit
              ? `When someone searches "${bareBrand}" without a city, your domain (${buyerHost}) appears at position #${bareHit.position}.`
              : bareCompetitors.length
                ? `When someone searches "${bareBrand}" without a location, Google surfaces other similarly named businesses first (${bareCompetitors.join(", ")}). Your domain (${buyerHost ?? "unknown"}) was not in the top 10 — a common issue for generic brand names competing nationally.`
                : `When someone searches "${bareBrand}", your domain (${buyerHost ?? "unknown"}) was not in the top 10 organic results.`,
            `Top results: ${formatTopResults(bareSearch.results)}`,
          ].join(" ")
        : (bareSearch?.limitation ?? ""),
      severity: businessSearchSeverity(bareHit, Boolean(bareSearch?.results.length)),
    })

    if (scopedSearch && scopedQuery.toLowerCase() !== bareBrand.toLowerCase()) {
      findings.push({
        label: `Brand search — "${scopedQuery}"`,
        value: scopedHit
          ? `Your site appears around position #${scopedHit.position} for this query.`
          : scopedSearch.results.length
            ? "Your website was not in the top 10 organic results for this location-scoped query."
            : scopedSearch.limitation ?? "Search data unavailable.",
        detail: scopedSearch.results.length
          ? [
              scopedHit
                ? `Adding "${marketLocationLabel(intake) ?? "your market"}" to the search helps disambiguate your business — your site ranks at #${scopedHit.position} for local prospects.`
                : `Even with location added ("${scopedQuery}"), your domain was not in the top 10. Local visibility may need strengthening.`,
              `Top results: ${formatTopResults(scopedSearch.results)}`,
            ].join(" ")
          : (scopedSearch.limitation ?? ""),
        severity: businessSearchSeverity(
          scopedHit,
          Boolean(scopedSearch.results.length),
        ),
      })
    }

    const site = bundle.digitalPresence.website
    const domainSnippetHit = bareSearch
      ? bareSearch.results.find((r) => buyerHost && r.link.includes(buyerHost))
      : null

    if (domainSnippetHit?.snippet && site.metaDescription) {
      findings.push({
        label: "What your site says vs what Google shows",
        value: SNIPPET_COMPARE_SUCCESS,
        detail: [
          `Your website description: "${site.metaDescription.slice(0, 200)}"`,
          `What Google shows under your link: "${domainSnippetHit.snippet.slice(0, 200)}"`,
          "If these differ a lot, prospects may see outdated messaging in search — worth updating your page title and short description.",
        ].join(" "),
        severity: "medium",
      })
    } else {
      findings.push({
        label: "What your site says vs what Google shows",
        value: SNIPPET_COMPARE_UNAVAILABLE,
        detail: [
          site.metaDescription
            ? `Your website's short description says: "${site.metaDescription.slice(0, 200)}"`
            : "Your site has no short description detected.",
          bareSearch?.results.length
            ? `Because ${buyerHost ?? "your website"} didn't appear on page 1 for "${bareBrand}" (searching your name without a city), we can't tell what description Google would show for you on that search.`
            : "Search data was limited for this comparison.",
        ].join(" "),
        severity: "high",
      })
    }

    if (ownerSearch && ownerSearch.results.length > 0) {
      findings.push({
        label: `Google — "${intake.ownerName}"`,
        value: `Page 1 includes: ${ownerSearch.results[0]?.title ?? "mixed results"}`,
        detail: [
          `Personal brand searches for "${intake.ownerName}" can influence trust before prospects visit your business site.`,
          formatTopResults(ownerSearch.results),
        ].join(" "),
        severity: ownerSearchSeverity(ownerSearch.results, buyerHost),
      })
    }

    const aiOverview = bundle.searchFootprint.searches.find((s) => s.aiOverview)?.aiOverview
    if (aiOverview) {
      findings.push({
        label: TERMS.aiOverview,
        value: "Google returned an AI Overview for one of your brand queries.",
        detail: aiOverview.slice(0, 400),
        severity: "medium",
      })
    }
  }

  return {
    id: "search_footprint",
    label: "Search footprint",
    status: sectionStatusFromSignals(searchSignals),
    score: scoreFromSignals(searchSignals),
    findings,
    scoreRows: signalRowsFromAudit(audit),
  }
}

export type SearchFootprintSynthesisResult = {
  section: ReportSection
  source: "llm" | "fallback"
}

export async function synthesizeFreeSearchFootprint(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  audit: AuditScoreBundle,
): Promise<SearchFootprintSynthesisResult> {
  const fallback = () =>
    buildDeterministicSearchFootprintSection(intake, bundle, audit)

  if (!researchBundleHasSerpData(bundle)) {
    console.log("[pipeline] search_footprint synthesis: fallback (no SERP data)")
    return { section: fallback(), source: "fallback" }
  }

  if (!isOpenAiConfigured()) {
    console.log("[pipeline] search_footprint synthesis: fallback (no OpenAI)")
    return { section: fallback(), source: "fallback" }
  }

  const result = await completeOpenAiJson<{ section: ReportSection }>({
    system: SEARCH_FOOTPRINT_FREE_PROMPT,
    user: `Report date: ${bundle.searchFootprint.reportDate}

RESEARCH AND SIGNALS:
${compactPayload(intake, bundle, audit)}

Return the search_footprint section JSON.`,
    maxTokens: 2000,
  })

  if (!result.ok) {
    console.log(
      `[pipeline] search_footprint synthesis: fallback (${result.error.slice(0, 80)})`,
    )
    return { section: fallback(), source: "fallback" }
  }

  const parsed = llmResponseSchema.safeParse(result.json)
  if (!parsed.success) {
    console.log("[pipeline] search_footprint synthesis: fallback (schema validation)")
    return { section: fallback(), source: "fallback" }
  }

  const section = parsed.data.section
  section.scoreRows = signalRowsFromAudit(audit)

  console.log("[pipeline] search_footprint synthesis: llm")
  return { section, source: "llm" }
}

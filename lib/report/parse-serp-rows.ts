import type { ReportSection } from "@/lib/pipeline/report-types"
import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import type { ResearchBundle } from "@/lib/pipeline/research-types"
import { isNonCompetitorHost, topCompetitorDomains } from "@/lib/research/serp/competitor-domains"
import { serpResultMentionsBrand } from "@/lib/research/serp/brand-serp-evidence"
import { hostnameFromUrl } from "@/lib/research/serp"
import type { SerpOrganicResult } from "@/lib/research/serp/types"
import { PRODUCT_NAMES } from "@/lib/report/outcome-copy"

export type SerpRowFromDetail = {
  rank: number
  domain: string
  serpPosition: number
  title?: string
}

export type PreviewCompetitor = {
  rank: number
  domain: string
  title?: string
}

function normalizeDomain(domain: string): string {
  return domain.toLowerCase().replace(/^www\./, "")
}

export function domainsMatch(a: string, b: string): boolean {
  const left = normalizeDomain(a)
  const right = normalizeDomain(b)
  if (!left || !right) return false
  return left === right || left.endsWith(`.${right}`) || right.endsWith(`.${left}`)
}

export function isExcludedSerpDomain(
  domain: string,
  excludeHost: string | null | undefined,
): boolean {
  if (isNonCompetitorHost(domain)) return true
  if (!excludeHost) return false
  return domainsMatch(domain, excludeHost)
}

export function parseSerpRowsFromDetail(
  detail: string,
  limit = 3,
  excludeHost?: string | null,
): SerpRowFromDetail[] {
  const rows: SerpRowFromDetail[] = []
  const pattern = /#(\d+)\s+([^(;]+?)\s*\((https?:\/\/[^)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(detail)) !== null && rows.length < limit) {
    const position = Number.parseInt(match[1]!, 10)
    const title = match[2]?.trim()
    const domain = hostnameFromUrl(match[3]!) ?? match[3]!
    if (
      !Number.isNaN(position) &&
      domain &&
      !isExcludedSerpDomain(domain, excludeHost)
    ) {
      rows.push({
        rank: rows.length + 1,
        domain,
        serpPosition: position,
        title: title || undefined,
      })
    }
  }
  return rows
}

export function extractPreviewCompetitor(
  detail: string,
  excludeHost?: string | null,
): PreviewCompetitor | undefined {
  const first = parseSerpRowsFromDetail(detail, 1, excludeHost)[0]
  if (!first) return undefined
  return {
    rank: first.serpPosition,
    domain: first.domain,
    title: first.title,
  }
}

/** Prefer finding detail that contains parseable SERP URLs (not limitation-only copy). */
export function serpDetailFromSections(
  competitive?: ReportSection | null,
  search?: ReportSection | null,
): string {
  const candidates = [
    competitive?.findings.find((f) => /service search/i.test(f.label))?.detail,
    ...((search?.findings ?? []).map((f) => f.detail)),
    competitive?.findings[0]?.detail,
  ]
  return candidates.find((d) => d?.includes("http"))?.trim() ?? ""
}

function buyerRankFromFindingValue(value: string): number | null {
  const match = value.match(/(?:position|rank(?:s)?(?:\s+at)?)\s*#(\d+)/i)
  if (!match?.[1]) return null
  const rank = Number.parseInt(match[1], 10)
  return Number.isFinite(rank) ? rank : null
}

function buyerHostFromFindingDetail(detail: string): string | null {
  const domainMatch = detail.match(/your domain \(([^)]+)\)/i)
  if (!domainMatch?.[1]) return null
  return hostnameFromUrl(domainMatch[1].trim()) ?? domainMatch[1].trim().toLowerCase()
}

/** Domain where the business site ranks on branded search (if detectable). */
export function deriveBuyerHostFromReport(
  report: LevelstackReportJson,
): string | null {
  const search = report.sections.find((s) => s.id === "search_footprint")
  if (!search) return null

  for (const finding of search.findings) {
    const fromDetail = buyerHostFromFindingDetail(finding.detail)
    if (fromDetail) return fromDetail
  }

  for (const finding of search.findings) {
    const targetPos = buyerRankFromFindingValue(finding.value)
    if (targetPos == null) continue
    const rows = parseSerpRowsFromDetail(finding.detail, 10)
    const ownRow = rows.find((r) => r.serpPosition === targetPos)
    if (ownRow) return ownRow.domain
  }

  return null
}

function previewFromSerpResults(
  results: SerpOrganicResult[],
  excludeHost: string | null | undefined,
  brandName?: string,
): PreviewCompetitor | undefined {
  const pool =
    brandName && brandName.trim().length >= 4
      ? results.filter((r) => serpResultMentionsBrand(r, brandName))
      : results

  const domain = topCompetitorDomains(pool, excludeHost ?? null, 1)[0]
  if (!domain) return undefined

  const row = pool.find((r) => {
    try {
      const host = new URL(r.link).hostname.replace(/^www\./, "").toLowerCase()
      return host === domain
    } catch {
      return false
    }
  })

  return {
    rank: row?.position ?? 1,
    domain,
    title: row?.title,
  }
}

function previewFromNameCollisions(
  bundle: ResearchBundle,
  excludeHost: string | null | undefined,
): PreviewCompetitor | undefined {
  const collisions = bundle.nameCollisions.collisions
  const preferred =
    collisions.find((c) => c.type === "direct_competitor") ?? collisions[0]
  if (!preferred) return undefined

  const domain = hostnameFromUrl(preferred.link)
  if (!domain || isExcludedSerpDomain(domain, excludeHost)) return undefined

  return { rank: 1, domain, title: preferred.title }
}

/**
 * Free-tier preview rival from raw brand SERP (not stored detail text).
 * When `brandName` is set, only brand-mentioned organic hits qualify — so
 * unrelated local co-rankers (e.g. a data center for "Atlanta") never become
 * the competitive tease.
 */
export function resolvePreviewCompetitorFromBundle(
  bundle: ResearchBundle,
  excludeHost?: string | null,
  brandName?: string,
): PreviewCompetitor | undefined {
  const brandResults = bundle.searchFootprint.searches.flatMap((s) => s.results)
  const fromSerp = previewFromSerpResults(brandResults, excludeHost, brandName)
  if (fromSerp) return fromSerp

  return previewFromNameCollisions(bundle, excludeHost)
}

export function resolvePreviewCompetitorForReport(
  report: LevelstackReportJson,
): PreviewCompetitor | undefined {
  const buyerHost = deriveBuyerHostFromReport(report)
  const fromMeta = report.meta.upgradeTeasers?.previewCompetitor
  if (fromMeta && !isExcludedSerpDomain(fromMeta.domain, buyerHost)) {
    return fromMeta
  }

  const search = report.sections.find((s) => s.id === "search_footprint")
  const competitive = report.sections.find((s) => s.id === "competitive_context")
  const detail = serpDetailFromSections(competitive, search)
  if (!detail) return undefined

  return extractPreviewCompetitor(detail, buyerHost)
}

export function extractBusinessSearchRank(report: LevelstackReportJson): number | null {
  const search = report.sections.find((s) => s.id === "search_footprint")
  const finding = search?.findings.find((f) =>
    /your site appears around position|your domain.*appears at position/i.test(f.value),
  )
  if (!finding) return null
  return buyerRankFromFindingValue(finding.value)
}

export function buildUpgradeTeaserCopy(report: LevelstackReportJson): string {
  const previewCompetitor = resolvePreviewCompetitorForReport(report)
  const rank = extractBusinessSearchRank(report)

  if (previewCompetitor) {
    return `#1 organic result for this search: ${previewCompetitor.domain} — unlock ${PRODUCT_NAMES.paid} ($97) for full competitive comparison and your prioritized 90-day action plan.`
  }

  if (rank != null && rank <= 3) {
    return `You rank #${rank} for your business name in Google — unlock ${PRODUCT_NAMES.paid} ($97) for service-search competitors, funnel diagnosis, and your prioritized 90-day action plan.`
  }

  return `Unlock your ${PRODUCT_NAMES.paid} ($97) for revenue funnel diagnosis, full competitive analysis, and your prioritized 90-day action plan.`
}

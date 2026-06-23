import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { hostnameFromUrl } from "@/lib/research/serp"

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

/** Domain where the business site ranks on branded search (if detectable). */
export function deriveBuyerHostFromReport(
  report: LevelstackReportJson,
): string | null {
  const search = report.sections.find((s) => s.id === "search_footprint")
  if (!search) return null

  for (const finding of search.findings) {
    const rankMatch = finding.value.match(/position\s*#(\d+)/i)
    if (!rankMatch?.[1]) continue
    const targetPos = Number.parseInt(rankMatch[1], 10)
    const rows = parseSerpRowsFromDetail(finding.detail, 10)
    const ownRow = rows.find((r) => r.serpPosition === targetPos)
    if (ownRow) return ownRow.domain
  }

  return null
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
  const detail = search?.findings.find((f) => f.detail.includes("http"))?.detail
  if (!detail) return undefined

  return extractPreviewCompetitor(detail, buyerHost)
}

export function extractBusinessSearchRank(report: LevelstackReportJson): number | null {
  const search = report.sections.find((s) => s.id === "search_footprint")
  const finding = search?.findings.find((f) =>
    /your site appears around position|your domain.*appears at position/i.test(f.value),
  )
  if (!finding) return null
  const match = finding.value.match(/position\s*#(\d+)/i)
  if (!match?.[1]) return null
  const rank = Number.parseInt(match[1], 10)
  return Number.isFinite(rank) ? rank : null
}

export function buildUpgradeTeaserCopy(report: LevelstackReportJson): string {
  const previewCompetitor = resolvePreviewCompetitorForReport(report)
  const rank = extractBusinessSearchRank(report)

  if (previewCompetitor) {
    return `#1 organic result for this search: ${previewCompetitor.domain} — unlock Full Report ($97) for full competitive comparison and your prioritized 90-day action plan.`
  }

  if (rank != null && rank <= 3) {
    return `You rank #${rank} for your business name in Google — unlock Full Report ($97) for service-search competitors, funnel diagnosis, and your prioritized 90-day action plan.`
  }

  return "Unlock your Full Report ($97) for revenue funnel diagnosis, full competitive analysis, and your prioritized 90-day action plan."
}

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

export function parseSerpRowsFromDetail(detail: string, limit = 3): SerpRowFromDetail[] {
  const rows: SerpRowFromDetail[] = []
  const pattern = /#(\d+)\s+([^(;]+?)\s*\((https?:\/\/[^)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(detail)) !== null && rows.length < limit) {
    const position = Number.parseInt(match[1]!, 10)
    const title = match[2]?.trim()
    const domain = hostnameFromUrl(match[3]!) ?? match[3]!
    if (!Number.isNaN(position) && domain) {
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

export function extractPreviewCompetitor(detail: string): PreviewCompetitor | undefined {
  const first = parseSerpRowsFromDetail(detail, 1)[0]
  if (!first) return undefined
  return {
    rank: first.serpPosition,
    domain: first.domain,
    title: first.title,
  }
}

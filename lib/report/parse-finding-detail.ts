export type SerpResultItem = {
  position: number
  title: string
  url: string
}

export type KeyValueItem = {
  key: string
  value: string
}

export type ParsedFindingDetail =
  | { kind: "serp"; intro?: string; items: SerpResultItem[] }
  | { kind: "keyValue"; items: KeyValueItem[] }
  | { kind: "bullets"; items: string[] }
  | { kind: "paragraphs"; paragraphs: string[] }
  | { kind: "plain"; text: string }

const SERP_ITEM_RE =
  /#(\d+)\s+(.+?)\s+\((https?:\/\/[^)]+)\)/g

/** Longest keys first so "Meta description" matches before "Meta" */
const KV_KEYS = [
  "Meta description",
  "Main heading (H1)",
  "Subheading (H2)",
  "Largest Contentful Paint (LCP)",
  "Cumulative Layout Shift (CLS)",
  "First Input Delay (FID)",
  "Search query",
  "Page title",
  "Meta",
  "H1",
  "H2",
  "LCP",
  "FID",
  "CLS",
  "Query",
  "Title",
] as const

function parseSerpDetail(detail: string): ParsedFindingDetail | null {
  const items: SerpResultItem[] = []
  let intro: string | undefined
  let body = detail.trim()

  const topResultsPrefix =
    /^(?:Top results(?: for your name)?|These are the top Google results prospects see):\s*/i
  if (topResultsPrefix.test(body)) {
    const introMatch = body.match(topResultsPrefix)
    intro = introMatch?.[0]?.replace(/:\s*$/, "").trim() ?? "Top results"
    body = body.replace(topResultsPrefix, "")
  }

  for (const match of body.matchAll(SERP_ITEM_RE)) {
    const position = match[1]
    const title = match[2]
    const url = match[3]
    if (!position || !title || !url) continue
    items.push({
      position: Number(position),
      title: title.trim(),
      url,
    })
  }

  if (items.length > 0) {
    return { kind: "serp", intro, items }
  }

  return null
}

function parseKeyValueDetail(detail: string): ParsedFindingDetail | null {
  const escaped = KV_KEYS.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const pattern = new RegExp(`(${escaped.join("|")}):\\s*`, "gi")
  const hits: { index: number; key: string; start: number }[] = []
  let m: RegExpExecArray | null
  while ((m = pattern.exec(detail)) !== null) {
    const key = m[1]
    if (!key) continue
    hits.push({
      index: m.index,
      key,
      start: m.index + m[0].length,
    })
  }

  if (hits.length < 2) return null

  const items: KeyValueItem[] = []
  for (let i = 0; i < hits.length; i++) {
    const hit = hits[i]
    const next = hits[i + 1]
    if (!hit) continue
    const end = next ? next.index : detail.length
    const value = detail.slice(hit.start, end).trim().replace(/\s+/g, " ")
    if (value) {
      items.push({
        key: hit.key.charAt(0).toUpperCase() + hit.key.slice(1).toLowerCase(),
        value,
      })
    }
  }

  return items.length >= 2 ? { kind: "keyValue", items } : null
}

function parseBulletDetail(detail: string): ParsedFindingDetail | null {
  const parts = detail
    .split(/\s*;\s+/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (parts.length < 2) return null
  if (!parts.every((p) => p.length < 200)) return null

  return { kind: "bullets", items: parts }
}

function parseParagraphDetail(detail: string): ParsedFindingDetail {
  const sentences = detail
    .split(/(?<=[.!?])\s+(?=[A-Z"“])/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (sentences.length >= 3 && detail.length > 180) {
    const paragraphs: string[] = []
    for (let i = 0; i < sentences.length; i += 2) {
      paragraphs.push(sentences.slice(i, i + 2).join(" "))
    }
    return { kind: "paragraphs", paragraphs }
  }

  if (sentences.length >= 2 && detail.length > 120) {
    return { kind: "paragraphs", paragraphs: sentences }
  }

  return { kind: "plain", text: detail }
}

export function parseFindingDetail(detail: string): ParsedFindingDetail | null {
  const trimmed = detail.trim()
  if (!trimmed) return null

  return (
    parseSerpDetail(trimmed) ??
    parseKeyValueDetail(trimmed) ??
    parseBulletDetail(trimmed) ??
    parseParagraphDetail(trimmed)
  )
}

/** Split value headline after common “include:” / “rank” patterns for emphasis */
export function splitFindingValue(value: string): {
  lead: string
  emphasis?: string
} {
  const includeMatch = value.match(/^(.+?include:)\s*(.+)$/i)
  if (includeMatch?.[1] && includeMatch[2]) {
    return { lead: includeMatch[1], emphasis: includeMatch[2] }
  }

  const rankMatch = value.match(/^(.+?#\d+[^.]*\.?)\s*(.+)$/i)
  if (rankMatch?.[1] && rankMatch[2] && rankMatch[2].length > 10) {
    return { lead: rankMatch[1].trim(), emphasis: rankMatch[2].trim() }
  }

  return { lead: value }
}

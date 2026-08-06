import type { ReactNode } from "react"

/** Match http(s) URLs; trailing punctuation is peeled off for the href. */
const URL_RE = /https?:\/\/[^\s<>"']+/gi

const TRAILING_PUNCT = /[),.;:!?]+$/

export function sanitizeHttpUrl(raw: string): string | null {
  try {
    const url = new URL(raw)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url.href
  } catch {
    return null
  }
}

/**
 * Split text into plain segments and safe http(s) links for report UI.
 */
export function linkifyText(text: string): ReactNode {
  if (!text) return text

  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  const re = new RegExp(URL_RE.source, URL_RE.flags)

  while ((match = re.exec(text)) !== null) {
    const raw = match[0]
    const start = match.index
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start))
    }

    const peeled = raw.replace(TRAILING_PUNCT, "")
    const suffix = raw.slice(peeled.length)
    const href = sanitizeHttpUrl(peeled)

    if (href) {
      nodes.push(
        <a
          key={`url-${start}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--rpt-blue-link)] underline-offset-2 hover:underline break-all"
        >
          {peeled}
        </a>,
      )
      if (suffix) nodes.push(suffix)
    } else {
      nodes.push(raw)
    }

    lastIndex = start + raw.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes.length === 1 ? nodes[0] : nodes
}

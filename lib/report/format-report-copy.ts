/**
 * Splits generated report prose into readable paragraphs for UI rendering.
 */
function isTruncatedParagraph(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed || /[.!?]$/.test(trimmed)) return false
  if (/^\S{1,6}[).]?$/.test(trimmed)) return true
  if (/\([\w.-]+\)\s\w{1,3}$/.test(trimmed)) return true
  return trimmed.length < 48 && /\s[a-z]{1,2}$/i.test(trimmed)
}

export function truncateReportCopy(text: string, maxLength = 220): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed

  const slice = trimmed.slice(0, maxLength)
  const lastSentenceEnd = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
  )
  if (lastSentenceEnd > maxLength * 0.45) {
    return slice.slice(0, lastSentenceEnd + 1).trim()
  }

  const lastSpace = slice.lastIndexOf(" ")
  if (lastSpace > maxLength * 0.6) {
    return `${slice.slice(0, lastSpace).trim()}…`
  }

  return `${slice.trim()}…`
}

export function splitReportCopyParagraphs(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  if (trimmed.includes("\n")) {
    return trimmed
      .split(/\n\s*\n+/)
      .map((part) => part.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .filter((part, index, parts) => {
        if (index < parts.length - 1) return true
        return !isTruncatedParagraph(part)
      })
  }

  // Split on sentence boundaries only (punctuation + space + next sentence start).
  // Avoids breaking URLs/domains like example.com mid-string.
  const sentences = trimmed
    .split(/(?<=[.!?])\s+(?=[A-Z"'(])/u)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((part, index, parts) => {
      if (index < parts.length - 1) return true
      return !isTruncatedParagraph(part)
    })

  if (sentences.length <= 1) {
    return isTruncatedParagraph(trimmed) ? [] : [trimmed]
  }

  return sentences
}

export function joinReportCopyParagraphs(paragraphs: string[]): string {
  return paragraphs.filter(Boolean).join("\n\n")
}

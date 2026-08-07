/**
 * Compose finding label + value into a complete-sentence headline for report cards.
 * Presentation-layer only — does not mutate stored report JSON.
 */

const ORDINAL: Record<string, string> = {
  "1": "first",
  "2": "second",
  "3": "third",
  "4": "fourth",
  "5": "fifth",
  "6": "sixth",
  "7": "seventh",
  "8": "eighth",
  "9": "ninth",
  "10": "tenth",
}

function ensureTerminalPunctuation(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  if (/[.!?]$/.test(trimmed)) return trimmed
  return `${trimmed}.`
}

function capitalize(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Drop trailing parentheticals like (personal name), (intake), (primary service). */
function stripLabelParentheticals(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*$/g, "").trim()
}

function extractQuotedTerm(label: string): string | null {
  const match = label.match(/[""]([^""]+)[""]/) ?? label.match(/"([^"]+)"/)
  return match?.[1]?.trim() ?? null
}

function looksLikeCompleteSentence(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (!/^[A-Z]/.test(trimmed)) return false
  if (
    /^(Your |You |A |An |The |When |Prospects |Google |This |No |We |Paid |Company |Profile )/i.test(
      trimmed,
    )
  ) {
    return true
  }
  if (/[.!?]$/.test(trimmed) && /\s/.test(trimmed) && trimmed.split(/\s+/).length >= 5) {
    return true
  }
  return false
}

function ordinalFromRankToken(token: string): string {
  const digits = token.replace(/\D/g, "")
  return ORDINAL[digits] ?? token
}

/**
 * Build a grammatical headline from a finding's display label and value.
 * SERP evidence rows stay compact elsewhere — this only covers the card headline.
 */
export function composeFindingSentence(
  sectionId: string,
  label: string,
  value: string,
): string {
  const cleanLabel = stripLabelParentheticals(label)
  const cleanValue = value.trim()
  if (!cleanValue) {
    return ensureTerminalPunctuation(cleanLabel || "Finding unavailable")
  }

  const quoted = extractQuotedTerm(cleanLabel)
  const lowerValue = cleanValue.toLowerCase()

  // AI platform cards — keep the platform name visible in the headline
  if (/ai overview|chatgpt|perplexity/i.test(cleanLabel)) {
    if (/not (one of|among|cited|mentioned)/i.test(cleanValue) || /your site is not/i.test(cleanValue)) {
      return ensureTerminalPunctuation(
        `${capitalize(cleanLabel)} does not cite your site in the answers prospects see`,
      )
    }
    if (looksLikeCompleteSentence(cleanValue) || /surfaces|citations|overview/i.test(cleanValue)) {
      const base = cleanValue.replace(/[.!?]$/, "")
      return ensureTerminalPunctuation(`${capitalize(cleanLabel)}: ${base}`)
    }
    return ensureTerminalPunctuation(`${capitalize(cleanLabel)}: ${cleanValue}`)
  }

  // Personal-name / page-1 complaint pattern
  if (
    /personal name|owner|founder/i.test(label) ||
    (/google page 1/i.test(cleanLabel) && /complaint|consumeraffairs/i.test(cleanValue))
  ) {
    const rankMatch =
      cleanValue.match(/(\d+)(?:st|nd|rd|th)\s+result/i) ??
      cleanValue.match(/#(\d+)/) ??
      cleanValue.match(/position\s*#?(\d+)/i)
    const subject = quoted ? `your name (“${quoted}”)` : "your name"
    if (rankMatch?.[1]) {
      const ordinal = ordinalFromRankToken(rankMatch[1])
      const rest = cleanValue
        .replace(/^.*?result:\s*/i, "")
        .replace(/^.*?result\s*/i, "")
        .trim()
      if (rest && /complaint|post|review/i.test(rest)) {
        const article = /^[aeiou]/i.test(rest) ? "an" : "a"
        return ensureTerminalPunctuation(
          `When prospects search ${subject}, the ${ordinal} result on Google page 1 is ${article} ${rest.charAt(0).toLowerCase()}${rest.slice(1)}`,
        )
      }
      return ensureTerminalPunctuation(
        `When prospects search ${subject}, a concerning result appears as the ${ordinal} listing on Google page 1`,
      )
    }
  }

  // Ranked website on Google page 1 for a query
  if (/google page 1|google —/i.test(cleanLabel) || sectionId === "search_footprint") {
    const rankMatch =
      cleanValue.match(/ranks?\s*#?(\d+)/i) ??
      cleanValue.match(/position\s*#?(\d+)/i) ??
      cleanValue.match(/#(\d+)/)
    if (rankMatch?.[1] && /your (website|site|domain)/i.test(cleanValue)) {
      const ordinal = ordinalFromRankToken(rankMatch[1])
      const forClause = quoted ? ` for “${quoted}”` : ""
      if (/competitors? in positions?\s*1/i.test(cleanValue)) {
        const forWithComma = quoted ? ` for “${quoted},”` : ","
        return ensureTerminalPunctuation(
          `Your website ranks ${ordinal} on Google page 1${forWithComma} with competitors holding the top three positions`,
        )
      }
      return ensureTerminalPunctuation(
        `Your website ranks ${ordinal} on Google page 1${forClause}`,
      )
    }
    if (/not in (the )?top/i.test(cleanValue) || /was not in the top/i.test(cleanValue)) {
      const queryBit = quoted ? ` for “${quoted}”` : ""
      return ensureTerminalPunctuation(
        `Your website does not appear in the top results on Google page 1${queryBit}`,
      )
    }
  }

  // Star rating / review metrics
  if (/★|stars?/i.test(cleanValue) && /review/i.test(`${cleanLabel} ${cleanValue}`)) {
    const stars = cleanValue.match(/(\d(?:\.\d)?)\s*★/)?.[1]
    const count = cleanValue.match(/from\s+(\d+)\s+reviews?/i)?.[1]
    const unanswered = cleanValue.match(/(\d+)\s+unanswered/i)?.[1]
    const subject = /google business|gbp/i.test(cleanLabel)
      ? "Your Google Business Profile"
      : /yelp/i.test(cleanLabel)
        ? "Your Yelp listing"
        : capitalize(cleanLabel || "Your review profile")
    if (stars && count) {
      let sentence = `${subject} shows ${stars} stars from ${count} reviews`
      if (unanswered) {
        sentence += `, and ${unanswered} negative review${unanswered === "1" ? " has" : "s have"} gone unanswered`
      }
      return ensureTerminalPunctuation(sentence)
    }
  }

  // Paid traffic / revenue funnel arrow shorthand
  if (/\$[\d,]+\/mo/.test(cleanValue) && /→|->/.test(cleanValue)) {
    const spend = cleanValue.match(/\$[\d,]+\/mo/)?.[0]
    const dest = cleanValue.split(/→|->/)[1]?.trim()
    if (spend && dest) {
      return ensureTerminalPunctuation(
        `You spend ${spend.replace("/mo", " a month")} on ads that land on a ${dest.replace(/^a\s+/i, "")}`,
      )
    }
  }

  // Instagram / social follower · last-post pattern
  if (/followers?/i.test(cleanValue) && /last post|days ago/i.test(cleanValue)) {
    const followers = cleanValue.match(/([\d,]+)\s+followers?/i)?.[1]
    const gap = cleanValue.match(/last post\s+(\d+\s+days?\s+ago)/i)?.[1]
    const platform = /instagram/i.test(cleanLabel)
      ? "Instagram"
      : /facebook/i.test(cleanLabel)
        ? "Facebook"
        : /linkedin/i.test(cleanLabel)
          ? "LinkedIn"
          : capitalize(stripLabelParentheticals(cleanLabel))
    if (followers && gap) {
      return ensureTerminalPunctuation(
        `Your ${platform} account has ${followers} followers, but the last post was ${gap}`,
      )
    }
  }

  // Competitive "You: not in top 3. Rival #1..."
  if (/you:\s*not in top/i.test(cleanValue) || (/not in top/i.test(cleanValue) && /#\d/.test(cleanValue))) {
    const queryBit = quoted ? ` for “${quoted}”` : ""
    const rivals = [...cleanValue.matchAll(/([A-Za-z][A-Za-z0-9 .&'-]+?)\s*#(\d+)/g)]
      .map((m) => {
        const name = m[1]?.trim()
        const rank = m[2]
        if (!name || !rank) return null
        return `${name} holds the ${ordinalFromRankToken(rank)} organic position`
      })
      .filter((row): row is string => Boolean(row))
      .slice(0, 2)
    if (rivals.length > 0) {
      return ensureTerminalPunctuation(
        `You do not appear in the top three results${queryBit}. ${rivals.join(" and ")}`,
      )
    }
    return ensureTerminalPunctuation(
      `You do not appear in the top three results${queryBit}`,
    )
  }

  // Review volume comparison
  if (/you:\s*\d+\s+reviews?/i.test(lowerValue) && /:/g.test(cleanValue)) {
    return ensureTerminalPunctuation(
      `Review volume lags rivals: ${cleanValue.replace(/\s+/g, " ").trim()}`,
    )
  }

  // Short fragment values (e.g. "Company profile found in search")
  if (cleanLabel && cleanValue) {
    if (/^(company |business )?profile found/i.test(cleanValue)) {
      return ensureTerminalPunctuation(
        `${capitalize(cleanLabel)} shows a company profile in search`,
      )
    }
    if (/listing found|page found/i.test(cleanValue)) {
      return ensureTerminalPunctuation(
        `${capitalize(cleanLabel)} shows a matching listing in search`,
      )
    }
    if (/^lighthouse/i.test(cleanValue) || /^\d+\/100/.test(cleanValue)) {
      return ensureTerminalPunctuation(
        `${capitalize(cleanLabel)} scores ${cleanValue.replace(/^lighthouse\s+/i, "")}`,
      )
    }
  }

  // Already a complete sentence — prefer value, optionally fold query context
  if (looksLikeCompleteSentence(cleanValue)) {
    if (quoted && !cleanValue.includes(quoted) && sectionId === "search_footprint") {
      const base = cleanValue.replace(/[.!?]$/, "")
      return ensureTerminalPunctuation(`${base} for “${quoted}”`)
    }
    return ensureTerminalPunctuation(cleanValue)
  }

  // Generic fallback: "Label: value" → "Label shows value." / "Label: Value."
  if (/^(no |not |missing|unclaimed|incomplete)/i.test(cleanValue)) {
    return ensureTerminalPunctuation(`${capitalize(cleanLabel)}: ${cleanValue}`)
  }

  if (cleanLabel && cleanValue) {
    return ensureTerminalPunctuation(`${capitalize(cleanLabel)}: ${cleanValue}`)
  }

  return ensureTerminalPunctuation(cleanValue || cleanLabel)
}

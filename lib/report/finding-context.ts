import type { ReportFinding } from "@/lib/pipeline/report-types"
import {
  SNIPPET_COMPARE_SUCCESS,
  SNIPPET_COMPARE_UNAVAILABLE,
} from "@/lib/report/customer-copy"
import { flagLabel, severityToFlag } from "@/lib/report/display-helpers"

export function extractRankFromValue(value: string): number | null {
  const match = value.match(/position\s*#(\d+)/i) ?? value.match(/ranks?\s*at\s*#(\d+)/i)
  if (!match?.[1]) return null
  const rank = Number.parseInt(match[1], 10)
  return Number.isFinite(rank) ? rank : null
}

/** Align badge with obvious positive signals (incl. legacy stored reports). */
export function effectiveFindingSeverity(
  sectionId: string,
  finding: ReportFinding,
): ReportFinding["severity"] {
  const combined = `${finding.label} ${finding.value} ${finding.detail}`.toLowerCase()

  if (sectionId === "search_footprint") {
    const rank = extractRankFromValue(finding.value)
    if (
      rank != null &&
      rank <= 3 &&
      /your site appears around position|your domain.*appears at position|ranks at #/i.test(
        finding.value,
      )
    ) {
      return "good"
    }

    if (finding.value === SNIPPET_COMPARE_SUCCESS) {
      return "good"
    }

    if (finding.value.includes(SNIPPET_COMPARE_UNAVAILABLE)) {
      return finding.severity === "critical" ? "critical" : "high"
    }
  }

  if (sectionId === "online_reputation") {
    const ratingMatch = finding.value.match(/(\d(?:\.\d)?)★/)
    const rating = ratingMatch?.[1] ? Number.parseFloat(ratingMatch[1]) : null
    if (rating != null && rating >= 4.2 && !/no review profile|no star rating|no review listings/i.test(combined)) {
      return "good"
    }
  }

  if (sectionId === "digital_presence") {
    if (/first impression on your homepage/i.test(finding.value) && /title:/i.test(finding.value)) {
      if (/meta description:/i.test(finding.detail) && /main heading/i.test(finding.detail)) {
        return "good"
      }
      return finding.severity === "high" ? "high" : "low"
    }

    const mobileMatch = finding.value.match(/(\d+)\/100/)
    if (mobileMatch?.[1]) {
      const score = Number.parseInt(mobileMatch[1], 10)
      if (score >= 70) return "good"
      if (score >= 50) return finding.severity === "critical" ? "critical" : "medium"
    }
  }

  return finding.severity
}

export function formatFindingLabel(
  sectionId: string,
  rawLabel: string,
): string {
  if (sectionId === "search_footprint" && rawLabel.startsWith("Google —")) {
    return rawLabel
  }
  if (rawLabel.startsWith("Review search:")) return rawLabel
  if (/ visibility$/i.test(rawLabel)) return rawLabel
  if (sectionId === "online_reputation" && /reviews?/i.test(rawLabel)) {
    const subject = rawLabel.replace(/\s+reviews?$/i, "").trim()
    return subject ? `Review search: ${subject}` : "Review-oriented search"
  }
  return rawLabel
}

export function findingContextLine(
  sectionId: string,
  finding: ReportFinding,
): string {
  const text = `${finding.label} ${finding.value} ${finding.detail}`.toLowerCase()

  if (sectionId === "search_footprint") {
    if (/when someone searches your name/i.test(finding.value)) {
      return "What appears when someone searches your owner or founder name on Google."
    }
    if (/ai overview|chatgpt|perplexity/i.test(finding.label)) {
      return "Summary shown when prospects ask AI tools about your business."
    }
    return "What prospects see when they search your business name on Google."
  }

  if (sectionId === "online_reputation") {
    if (/complaint/i.test(finding.label)) {
      return "Whether negative feedback shows up in public search results."
    }
    return "Whether strangers can find credible star ratings and review counts for you."
  }

  if (sectionId === "digital_presence") {
    if (/homepage|title|meta|heading/i.test(finding.label)) {
      return "First-impression signals from your website homepage."
    }
    if (/mobile|speed|pagespeed|lighthouse/i.test(text)) {
      return "How fast and stable your site feels on a phone."
    }
    if (/google business|gbp|maps/i.test(text)) {
      return "Your public Google Maps listing — hours, reviews, and directions."
    }
    if (/social/i.test(finding.label)) {
      return "Public social profiles prospects may check before contacting you."
    }
    return "Signals from the places prospects land after they find you online."
  }

  return "What we measured in public search and site checks."
}

export function findingSeverityExplanation(
  sectionId: string,
  finding: ReportFinding,
): string {
  const severity = effectiveFindingSeverity(sectionId, finding)
  const combined = `${finding.value} ${finding.detail}`.toLowerCase()

  if (/your website ranks instead|homepage first|not a review profile|not a dedicated review/i.test(combined)) {
    return "Prospects searching for reviews see your website, not Yelp or Google review listings — third-party proof is harder to find."
  }

  if (/no review listings found|no platform-specific review|no star rating/i.test(combined)) {
    return "Searchers may not find credible third-party proof that you are active and trustworthy."
  }

  if (sectionId === "search_footprint") {
    if (/not in the top 10|was not in the top/i.test(finding.value)) {
      return "Prospects searching your business name won't see your website on page 1."
    }

    const rank = extractRankFromValue(finding.value)
    if (
      rank != null &&
      /your site appears around position|your domain.*appears at position|ranks at #/i.test(
        finding.value,
      )
    ) {
      if (rank <= 3) {
        return "Strong visibility — your site is one of the first results prospects see for this query. Keep titles, listings, and content fresh to protect this placement."
      }
      if (rank <= 6) {
        return "You are on page 1, but results above you may win the click first — small SEO and listing improvements can help."
      }
      return "You appear on page 1 near the bottom — easy for prospects to miss unless they scroll."
    }

    if (finding.value === SNIPPET_COMPARE_SUCCESS) {
      return "Your website description and Google's snippet align — keep both updated when your offer changes."
    }

    if (finding.value.includes(SNIPPET_COMPARE_UNAVAILABLE)) {
      return "We couldn't compare descriptions because your site didn't rank on page 1 for the unqualified brand search — fixing visibility unlocks this check."
    }

    if (/when someone searches your name/i.test(finding.value)) {
      if (severity === "good" || severity === "low") {
        return "Your business or personal site appears prominently when people search your name — a strong trust signal."
      }
      if (/complaint|consumeraffairs|scam|fraud/i.test(combined)) {
        return "Negative results appear when people search your name — address or monitor these before prospects see them."
      }
      return "Page 1 for your name doesn't clearly feature your website — prospects may click a directory or social profile instead."
    }

    if (/no ai overview|no google ai overview/i.test(combined)) {
      return "Google did not show an AI Overview for these queries — organic results matter more for now."
    }

    if (/ai overview|chatgpt|perplexity/i.test(finding.label)) {
      if (severity === "good" || severity === "low") {
        return "AI tools surface recognizable information about you — keep entity details consistent on your site and Google Business Profile."
      }
      return "Limited or missing AI visibility — strengthen clear business facts on your site and Maps listing."
    }

    if (/no organic results/i.test(finding.value)) {
      return "Your name may not appear clearly when people search for you personally."
    }
  }

  if (sectionId === "online_reputation") {
    const ratingMatch = finding.value.match(/(\d(?:\.\d)?)★/)
    const rating = ratingMatch?.[1] ? Number.parseFloat(ratingMatch[1]) : null

    if (rating != null && rating >= 4.2) {
      return "Review signals look solid — keep collecting recent feedback to stay ahead of competitors."
    }

    if (finding.severity === "critical" || (rating != null && rating < 4)) {
      return "Ratings under 4 stars often cost you comparisons before a prospect ever calls."
    }
    if (severity === "high") {
      return "This gap makes you look harder to trust than competitors with stronger review signals."
    }
    if (severity === "good") {
      return "Review signals look solid — keep collecting recent feedback to stay ahead."
    }
  }

  if (sectionId === "digital_presence") {
    if (/first impression on your homepage/i.test(finding.value)) {
      if (severity === "good") {
        return "Core homepage elements are present — review messaging periodically so it matches what you promise in ads and search."
      }
      if (/could not read|missing/i.test(combined)) {
        return "A missing or weak homepage title makes you look less professional in search and browser tabs."
      }
      return "Some homepage elements are missing or weak — prospects decide quickly from title and description alone."
    }

    if (/mobile site speed|lighthouse mobile score/i.test(finding.value)) {
      const score = Number.parseInt(finding.value.match(/(\d+)\/100/)?.[1] ?? "0", 10)
      if (score >= 70) {
        return "Mobile performance is in a healthy range for trust and conversions."
      }
      if (score < 50) {
        return "Pages under 50 often feel broken on phones — visitors leave before they read your offer."
      }
      return "Scores under 70 feel sluggish on mobile — worth improving before scaling traffic."
    }

    if (/not confirmed|no confirmed|not found/i.test(combined)) {
      return "Without a complete Maps listing, you miss map clicks, directions, and review visibility."
    }
  }

  const kind = severityToFlag(severity)
  if (kind === "critical") {
    return "Fix this before spending more on ads or outreach — it likely costs you trust today."
  }
  if (kind === "attention") {
    if (/position #/i.test(finding.value)) {
      return "You rank on page 1, but not in the top slots where most clicks go — improving SEO and listings could move you up."
    }
    return "Worth addressing soon — prospects may notice this gap when comparing you to alternatives."
  }
  return "This signal looks healthy relative to the other findings in this section."
}

export function scoreRowHint(label: string, tone: "red" | "amber" | "green"): string {
  if (/https/i.test(label)) {
    return tone === "green"
      ? "Secure connections build baseline trust."
      : "Browsers warn visitors on non-HTTPS sites."
  }
  if (/title/i.test(label)) {
    return tone === "green" || tone === "amber"
      ? "Titles appear in search results and browser tabs."
      : "Missing titles hurt click-through from search."
  }
  if (/meta description/i.test(label)) {
    return "This short blurb often appears under your link in Google."
  }
  if (/cta|call to action/i.test(label)) {
    return "Clear next-step language helps visitors know how to contact you."
  }
  if (/mobile|pagespeed|performance/i.test(label)) {
    return "70+ is healthy; under 50 often feels broken on phones."
  }
  if (/google business|gbp|maps/i.test(label)) {
    return tone === "green"
      ? "Strong Maps presence supports local discovery."
      : "Incomplete listings reduce map clicks and directions."
  }
  return ""
}

export function formatPrintFindingBlock(
  sectionId: string,
  finding: ReportFinding,
): {
  label: string
  context: string
  value: string
  detail: string
  flag: string
  explanation: string
} {
  return {
    label: formatFindingLabel(sectionId, finding.label),
    context: findingContextLine(sectionId, finding),
    value: finding.value,
    detail: finding.detail,
    flag: flagLabel(effectiveFindingSeverity(sectionId, finding)),
    explanation: findingSeverityExplanation(sectionId, finding),
  }
}

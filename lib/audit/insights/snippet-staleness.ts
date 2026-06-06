import type { AuditInsight } from "@/lib/audit/types"
import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import type { ResearchBundle } from "@/lib/pipeline/research-types"
import { hostnameFromUrl } from "@/lib/research/serp"

function normalize(s: string | null | undefined): string {
  return (s ?? "").replace(/\s+/g, " ").trim()
}

export function detectSnippetStaleness(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
): AuditInsight[] {
  const host = hostnameFromUrl(intake.websiteUrl)
  const website = bundle.digitalPresence.website
  const brandResult = bundle.searchFootprint.searches[0]?.results.find((r) =>
    host ? r.link.includes(host) : false,
  )

  const googleSnippet = brandResult?.snippet
  const liveMeta = website.metaDescription
  const liveH1 = website.h1

  if (!googleSnippet || (!liveMeta && !liveH1)) return []

  const live = normalize(liveMeta ?? liveH1)
  const cached = normalize(googleSnippet)

  if (live.toLowerCase() === cached.toLowerCase()) return []

  return [
    {
      id: "snippet_staleness",
      label: "Search Snippet Staleness",
      severity: "medium",
      summary:
        "Google is displaying messaging that differs from your live site — this affects conversion and trust.",
      details: [
        `Live meta/H1: "${live.slice(0, 160)}"`,
        `Google snippet: "${cached.slice(0, 160)}"`,
      ],
      remediation: [
        "Update meta description and H1 to match desired positioning",
        "Request re-crawl in Google Search Console",
        "Allow 1–2 weeks for snippet refresh",
      ],
    },
  ]
}

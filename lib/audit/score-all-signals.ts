import {
  letterGradeFromScore,
  SIGNAL_WEIGHTS,
  statusToPercent,
  type AuditInsight,
  type AuditScoreBundle,
  type AuditSignalResult,
  type SignalStatus,
} from "@/lib/audit/types"
import { detectInfrastructureLeakage } from "@/lib/audit/insights/infrastructure-leakage"
import { detectNameCollisions } from "@/lib/audit/insights/name-collision"
import { detectSnippetStaleness } from "@/lib/audit/insights/snippet-staleness"
import { detectSubdomainExposure } from "@/lib/audit/insights/subdomain-detector"
import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import type { ResearchBundle } from "@/lib/pipeline/research-types"
import { hostnameFromUrl } from "@/lib/research/serp"
import type { ReportTier } from "@/lib/levelstack-plans"

const SOCIAL_PLATFORMS = [
  "linkedin.com",
  "facebook.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "youtube.com",
  "tiktok.com",
] as const

const DIRECTORY_SITES = [
  "google.com/maps",
  "yelp.com",
  "clutch.co",
  "g2.com",
  "capterra.com",
  "producthunt.com",
  "crunchbase.com",
] as const

function normalizeText(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().replace(/\s+/g, " ").trim()
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(normalizeText(a).split(/\W+/).filter(Boolean))
  const tb = new Set(normalizeText(b).split(/\W+/).filter(Boolean))
  if (ta.size === 0 || tb.size === 0) return 0
  let overlap = 0
  for (const t of ta) {
    if (tb.has(t)) overlap++
  }
  return overlap / Math.max(ta.size, tb.size)
}

function scoreGoogleIndexing(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
): AuditSignalResult {
  const host = hostnameFromUrl(intake.websiteUrl)
  const brandQuery = bundle.searchFootprint.searches[0]
  const indexed = brandQuery?.results.some((r) =>
    host ? r.link.includes(host) : false,
  )

  return {
    id: "google_indexing",
    label: "Google Indexing",
    status: indexed ? "pass" : "fail",
    finding: indexed
      ? "Your primary domain appears in Google search results for your brand name."
      : "Your primary domain does not appear prominently when searching your brand name.",
    evidence: brandQuery?.results.slice(0, 3).map((r) => r.link) ?? [],
    tier: "free",
  }
}

function scoreSnippetAccuracy(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
): AuditSignalResult {
  const website = bundle.digitalPresence.website
  const brandQuery = bundle.searchFootprint.searches[0]
  const host = hostnameFromUrl(intake.websiteUrl)
  const domainHit = brandQuery?.results.find((r) =>
    host ? r.link.includes(host) : false,
  )

  if (!domainHit) {
    return {
      id: "search_snippet_accuracy",
      label: "Search Snippet Accuracy",
      status: "warning",
      finding:
        "Could not compare your Google snippet — your site did not appear in top results for this query.",
      evidence: brandQuery?.results.slice(0, 3).map((r) => r.link) ?? [],
      tier: "free",
    }
  }

  const snippet = domainHit.snippet

  if (!snippet || !website.metaDescription) {
    return {
      id: "search_snippet_accuracy",
      label: "Search Snippet Accuracy",
      status: "warning",
      finding: "Could not compare live meta description to Google snippet.",
      evidence: [],
      tier: "free",
    }
  }

  const overlap = tokenOverlap(snippet, website.metaDescription)
  const h1Overlap = website.h1 ? tokenOverlap(snippet, website.h1) : 0
  const status: SignalStatus =
    overlap >= 0.5 || h1Overlap >= 0.5 ? "pass" : overlap >= 0.25 ? "warning" : "fail"

  return {
    id: "search_snippet_accuracy",
    label: "Search Snippet Accuracy",
    status,
    finding:
      status === "pass"
        ? "Google snippet aligns with your live meta description or H1."
        : status === "warning"
          ? "Google snippet partially diverges from your live meta description."
          : "Google is displaying messaging that differs from your live site — a positioning trust issue.",
    evidence: [snippet.slice(0, 200), website.metaDescription.slice(0, 200)],
    tier: "free",
  }
}

function scoreMetaOg(bundle: ResearchBundle): AuditSignalResult {
  const w = bundle.digitalPresence.website
  const ext = bundle.digitalPresence.websiteExtended
  const checks = [
    { label: "Title tag", ok: Boolean(w.title) },
    { label: "Meta description", ok: Boolean(w.metaDescription) },
    { label: "OG image", ok: Boolean(ext?.ogImage) },
    { label: "Twitter card", ok: Boolean(ext?.twitterCard) },
  ]
  const passed = checks.filter((c) => c.ok).length
  const status: SignalStatus =
    passed === checks.length ? "pass" : passed >= 2 ? "warning" : "fail"

  return {
    id: "meta_og_completeness",
    label: "Meta & OG Completeness",
    status,
    finding: `${passed}/${checks.length} tags present: ${checks.map((c) => `${c.label} (${c.ok ? "✓" : "✗"})`).join(", ")}.`,
    evidence: checks.map((c) => c.label),
    tier: "free",
  }
}

function scoreSocialCoverage(bundle: ResearchBundle): AuditSignalResult {
  const found = bundle.socialSearch.platforms.filter((p) => p.found)
  const pct = Math.round((found.length / SOCIAL_PLATFORMS.length) * 100)
  const status: SignalStatus = pct >= 50 ? "pass" : pct >= 25 ? "warning" : "fail"

  return {
    id: "social_platform_coverage",
    label: "Social Platform Coverage",
    status,
    finding:
      found.length > 0
        ? `${found.length} major platform(s) detected: ${found.map((p) => p.platform).join(", ")}.`
        : "No major social platforms detected in search for your brand.",
    evidence: found.map((p) => p.url ?? p.platform),
    tier: "free",
  }
}

function scoreSubdomains(bundle: ResearchBundle): AuditSignalResult {
  const subs = bundle.subdomainExposure.subdomains
  const status: SignalStatus =
    subs.length === 0 ? "pass" : subs.some((s) => s.severity === "high") ? "fail" : "warning"

  return {
    id: "subdomain_exposure",
    label: "Subdomain Exposure",
    status,
    finding:
      subs.length === 0
        ? "No unintended indexed subdomains detected."
        : `${subs.length} subdomain(s) may be publicly indexed.`,
    evidence: subs.map((s) => s.hostname),
    tier: "free",
  }
}

function scoreDirectories(bundle: ResearchBundle): AuditSignalResult {
  const hits = DIRECTORY_SITES.filter((site) =>
    bundle.reputation.searches.some((s) =>
      s.results.some((r) => r.link.includes(site.replace("google.com/maps", "google.com"))),
    ),
  )
  const count = hits.length
  const status: SignalStatus = count >= 4 ? "pass" : count >= 2 ? "warning" : "fail"

  return {
    id: "directory_presence",
    label: "Directory Presence",
    status,
    finding: `Present on ${count}/6 major directories (${hits.join(", ") || "none detected"}).`,
    evidence: hits,
    tier: "free",
  }
}

function scoreMentions(bundle: ResearchBundle): AuditSignalResult {
  const count = bundle.brandMentions.mentions.length
  const status: SignalStatus = count >= 5 ? "pass" : count >= 2 ? "warning" : "fail"

  return {
    id: "third_party_mentions",
    label: "Third-Party Mentions",
    status,
    finding:
      count > 0
        ? `${count} third-party mention(s) found outside owned properties.`
        : "Few or no third-party mentions detected — limited social proof in search.",
    evidence: bundle.brandMentions.mentions.slice(0, 5).map((m) => m.url),
    tier: "paid",
  }
}

function scoreNameCollision(bundle: ResearchBundle): AuditSignalResult {
  const collisions = bundle.nameCollisions.collisions
  const count = collisions.length
  const status: SignalStatus = count <= 1 ? "pass" : count <= 3 ? "warning" : "fail"

  return {
    id: "name_collision",
    label: "Name Collision Score",
    status,
    finding:
      count === 0
        ? "Your brand name appears distinct in search results."
        : `${count} other entit${count === 1 ? "y competes" : "ies compete"} for your brand name in search.`,
    evidence: collisions.map((c) => `${c.type}: ${c.title}`),
    tier: "paid",
  }
}

function scoreInfrastructure(bundle: ResearchBundle): AuditSignalResult {
  const leaks = bundle.infrastructureLeakage.instances
  const status: SignalStatus =
    leaks.length === 0 ? "pass" : leaks.some((l) => l.severity === "high") ? "fail" : "warning"

  return {
    id: "infrastructure_leakage",
    label: "Infrastructure Leakage",
    status,
    finding:
      leaks.length === 0
        ? "No infrastructure leakage detected in search results."
        : `${leaks.length} potential leakage instance(s) found.`,
    evidence: leaks.map((l) => l.url),
    tier: "paid",
  }
}

function scorePositioning(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
): AuditSignalResult {
  const siteTitle = normalizeText(bundle.digitalPresence.website.title)
  const gbpTitle = normalizeText(bundle.digitalPresence.gbp.title)
  const brand = normalizeText(intake.primaryBusinessName)
  const matches = [siteTitle, gbpTitle].filter((t) => t && tokenOverlap(t, brand) >= 0.4)
  const status: SignalStatus =
    matches.length >= 2 ? "pass" : matches.length === 1 ? "warning" : "fail"

  return {
    id: "positioning_consistency",
    label: "Positioning Consistency",
    status,
    finding:
      status === "pass"
        ? "Site and directory messaging align with your brand name."
        : "Messaging varies across your site and directory listings.",
    evidence: [siteTitle, gbpTitle].filter(Boolean),
    tier: "paid",
  }
}

export function scoreAllSignals(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  reportTier: ReportTier,
): AuditScoreBundle {
  const allSignals: AuditSignalResult[] = [
    scoreGoogleIndexing(intake, bundle),
    scoreSnippetAccuracy(intake, bundle),
    scoreMetaOg(bundle),
    scoreSocialCoverage(bundle),
    scoreSubdomains(bundle),
    scoreDirectories(bundle),
    scoreMentions(bundle),
    scoreNameCollision(bundle),
    scoreInfrastructure(bundle),
    scorePositioning(intake, bundle),
  ]

  const signals =
    reportTier === "free_snapshot"
      ? allSignals.filter((s) => s.tier === "free")
      : allSignals

  const insights: AuditInsight[] = [
    ...detectSubdomainExposure(bundle),
    ...detectSnippetStaleness(intake, bundle),
    ...detectNameCollisions(bundle),
    ...detectInfrastructureLeakage(bundle),
  ]

  let weightedSum = 0
  let weightTotal = 0
  for (const signal of signals) {
    const weight = SIGNAL_WEIGHTS[signal.id] ?? 10
    weightedSum += statusToPercent(signal.status) * weight
    weightTotal += weight
  }

  const overallScore = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0

  return {
    signals,
    insights,
    overallScore,
    letterGrade: letterGradeFromScore(overallScore),
  }
}

import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { businessNameForSearch, marketLocationLabel } from "@/lib/intake/location"
import {
  bestReputationHit,
  platformFromQuery,
} from "@/lib/research/reputation-parse"
import type { SerpOrganicResult } from "@/lib/research/serp"
import { hostnameFromUrl, resultsMentionDomain } from "@/lib/research/serp"
import type { ResearchBundle } from "@/lib/pipeline/research-types"
import type { ReportSection } from "@/lib/pipeline/report-types"
import {
  businessSearchSeverity,
  ownerSearchSeverity,
} from "@/lib/pipeline/search-finding-severity"
import { TERMS } from "@/lib/report/customer-terms"
import {
  customerGbpFindingDetail,
  customerGbpFindingValue,
} from "@/lib/report/customer-copy"
import { computeDistinctHighlightsFromSections } from "@/lib/report/executive-dedup"
import { truncateReportCopy } from "@/lib/report/format-report-copy"

type ScoreRow = NonNullable<ReportSection["scoreRows"]>[number]

function scoreFromFindings(
  findings: { severity: string }[],
): { score: number; status: "critical" | "attention" | "good" } {
  if (findings.some((f) => f.severity === "critical")) {
    return { score: 42, status: "critical" }
  }
  if (findings.some((f) => f.severity === "high" || f.severity === "medium")) {
    return { score: 62, status: "attention" }
  }
  return { score: 78, status: "good" }
}

function formatTopResults(results: SerpOrganicResult[], limit = 3): string {
  return results
    .slice(0, limit)
    .map((r) => `#${r.position} ${r.title} (${r.link})`)
    .join("; ")
}

function hasSerpData(bundle: ResearchBundle): boolean {
  return (
    bundle.searchFootprint.searches.some((s) => s.results.length > 0) ||
    bundle.reputation.searches.some((s) => s.results.length > 0)
  )
}

export function researchBundleHasSerpData(bundle: ResearchBundle): boolean {
  return hasSerpData(bundle)
}

export function buildSectionsFromResearch(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
): ReportSection[] {
  const buyerHost = hostnameFromUrl(intake.websiteUrl)
  const businessQuery = businessNameForSearch(intake)
  const businessSearch = bundle.searchFootprint.searches.find(
    (s) => s.query.toLowerCase() === businessQuery.toLowerCase(),
  ) ??
    bundle.searchFootprint.searches.find((s) =>
      s.query.toLowerCase().includes(intake.primaryBusinessName.toLowerCase()),
    )
  const ownerSearch = bundle.searchFootprint.searches.find((s) =>
    s.query.toLowerCase().includes(intake.ownerName.toLowerCase()),
  )
  const serviceSearch =
    bundle.competitiveContext.serviceSearch ??
    bundle.searchFootprint.searches.find((s) =>
      s.query.toLowerCase().includes(intake.primaryService.toLowerCase()),
    )

  const businessHit = businessSearch
    ? resultsMentionDomain(businessSearch.results, buyerHost)
    : null

  const searchFindings = [
    {
      label: `Google — "${businessQuery}"`,
      value: businessHit
        ? `Your site appears around position #${businessHit.position}`
        : businessSearch?.results.length
          ? "Your website was not in the top 10 organic results for this query."
          : businessSearch?.limitation ?? "Search data unavailable for business name.",
      detail: businessSearch?.results.length
        ? `Top results: ${formatTopResults(businessSearch.results)}`
        : (businessSearch?.limitation ?? ""),
      severity: businessSearchSeverity(
        businessHit,
        Boolean(businessSearch?.results.length),
      ),
    },
    {
      label: `Google — "${intake.ownerName}"`,
      value:
        ownerSearch?.results.length ?
          `Page 1 includes: ${ownerSearch.results[0]?.title ?? "mixed results"}`
        : "No organic results captured.",
      detail: ownerSearch?.results.length
        ? formatTopResults(ownerSearch.results)
        : (ownerSearch?.limitation ?? ""),
      severity: ownerSearchSeverity(
        ownerSearch?.results ?? [],
        buyerHost,
      ),
    },
  ]

  const reputationFindings = buildReputationFindings(intake, bundle)

  const site = bundle.digitalPresence.website
  const psi = bundle.digitalPresence.pageSpeed
  const gbp = bundle.digitalPresence.gbp
  const digitalScoreRows: ScoreRow[] = [
    {
      label: TERMS.https,
      value: site.usesHttps ? "Yes" : "No",
      percent: site.usesHttps ? 100 : 20,
      tone: site.usesHttps ? ("green" as const) : ("red" as const),
    },
    {
      label: "Homepage title",
      value: site.title ? "Present" : "Missing",
      percent: site.title ? 80 : 15,
      tone: site.title ? ("amber" as const) : ("red" as const),
    },
    {
      label: `${TERMS.cta} language`,
      value: site.hasCtaLanguage ? "Detected" : "Weak / missing",
      percent: site.hasCtaLanguage ? 75 : 25,
      tone: site.hasCtaLanguage ? ("green" as const) : ("amber" as const),
    },
    {
      label: "Meta description",
      value: site.metaDescription ? "Present" : "Missing",
      percent: site.metaDescription ? 70 : 20,
      tone: site.metaDescription ? ("amber" as const) : ("red" as const),
    },
    ...(psi.mobileScore != null
      ? [
          {
            label: `Mobile performance (${TERMS.pageSpeed})`,
            value: `${psi.mobileScore}/100`,
            percent: psi.mobileScore,
            tone:
              psi.mobileScore >= 70
                ? ("green" as const)
                : psi.mobileScore >= 50
                  ? ("amber" as const)
                  : ("red" as const),
          },
        ]
      : []),
    ...(gbp.found
      ? [
          {
            label: TERMS.gbp,
            value:
              gbp.rating != null && gbp.reviewCount != null
                ? `${gbp.rating}★ · ${gbp.reviewCount} reviews`
                : gbp.title ?? "Listing found",
            percent:
              gbp.rating != null
                ? Math.min(100, Math.round((gbp.rating / 5) * 100))
                : 55,
            tone:
              (gbp.rating ?? 0) >= 4.2 && (gbp.reviewCount ?? 0) >= 10
                ? ("green" as const)
                : (gbp.reviewCount ?? 0) < 5
                  ? ("red" as const)
                  : ("amber" as const),
          },
        ]
      : [
          {
            label: TERMS.gbp,
            value: "Not confirmed in Maps search",
            percent: 25,
            tone: "red" as const,
          },
        ]),
  ]

  const digitalFindings = [
    {
      label: "Homepage signals",
      value: site.title ? `Title: “${site.title}”` : "Could not read page title.",
      detail: [
        site.metaDescription ? `${TERMS.metaDescription}: ${site.metaDescription}` : null,
        site.h1 ? `${TERMS.mainHeading}: ${site.h1}` : null,
        site.limitation,
      ]
        .filter(Boolean)
        .join(" "),
      severity: site.title ? ("medium" as const) : ("high" as const),
    },
    ...(psi.mobileScore != null
      ? [
          {
            label: "Mobile site speed",
            value: `Lighthouse mobile score ${psi.mobileScore}/100`,
            detail: [
              psi.lcp ? `${TERMS.lcp}: ${psi.lcp}` : null,
              psi.cls ? `${TERMS.cls}: ${psi.cls}` : null,
              `Source: ${TERMS.pageSpeed} (mobile).`,
            ]
              .filter(Boolean)
              .join(" "),
            severity:
              psi.mobileScore < 50
                ? ("critical" as const)
                : psi.mobileScore < 70
                  ? ("high" as const)
                  : ("medium" as const),
          },
        ]
      : psi.limitation
        ? [
            {
              label: "Mobile site speed",
              value: `${TERMS.pageSpeed} data unavailable`,
              detail: psi.limitation,
              severity: "medium" as const,
            },
          ]
        : []),
    ...(gbp.found
      ? [
          {
            label: TERMS.gbp,
            value:
              gbp.rating != null
                ? `${gbp.title ?? intake.primaryBusinessName} — ${gbp.rating}★ (${gbp.reviewCount ?? "?"} reviews)`
                : (gbp.title ?? "Maps listing found"),
            detail: [
              gbp.address ? `Address: ${gbp.address}` : null,
              gbp.category ? `Category: ${gbp.category}` : null,
              gbpLocationMismatch(intake, gbp.address)
                ? `Listed address may not match your stated market (${marketLocationLabel(intake)}). Confirm this is your location in Google Maps.`
                : null,
            ]
              .filter(Boolean)
              .join(" "),
            severity: gbpLocationMismatch(intake, gbp.address)
              ? ("high" as const)
              : (gbp.reviewCount ?? 0) < 5 || (gbp.rating ?? 5) < 4
                ? ("high" as const)
                : ("good" as const),
          },
        ]
      : [
          {
            label: TERMS.gbp,
            value: customerGbpFindingValue(gbp, intake.primaryBusinessName),
            detail: customerGbpFindingDetail(gbp, TERMS.gbp),
            severity: "high" as const,
          },
        ]),
    ...buildSocialFindings(bundle),
  ]

  const runsAds = intake.hasActiveAdSpend === "yes"
  const funnelPsi = bundle.revenueFunnel.pageSpeed
  const funnelFindings = [
    {
      label: "Offer & conversion signals",
      value: `${intake.primaryService} · ${intake.pricePoint}`,
      detail: [
        bundle.revenueFunnel.intakeNotes,
        site.hasCtaLanguage
          ? `${TERMS.cta} language detected on homepage.`
          : `Limited ${TERMS.cta} language on homepage — prospects may not see a clear next step.`,
        funnelPsi.mobileScore != null
          ? `Mobile ${TERMS.pageSpeed} score: ${funnelPsi.mobileScore}/100${funnelPsi.mobileScore < 60 ? " — slow mobile experience hurts ad and organic conversion." : "."}`
          : null,
      ]
        .filter(Boolean)
        .join(" "),
      severity: site.hasCtaLanguage ? ("low" as const) : ("medium" as const),
    },
    ...(runsAds
      ? [
          {
            label: "Paid traffic → landing",
            value: `Active ad spend (${intake.adPlatforms ?? "paid"} ~${intake.adBudget ?? "budget not specified"})`,
            detail: [
              "Prospects who click ads land on your site before they trust you from search.",
              site.hasCtaLanguage
                ? `Homepage shows some ${TERMS.cta} language; still verify message match with ad copy and offer.`
                : `Weak homepage ${TERMS.cta} and trust signals increase wasted spend — consider pausing scale until landing is fixed.`,
            ].join(" "),
            severity: site.hasCtaLanguage ? ("high" as const) : ("critical" as const),
          },
        ]
      : []),
  ]

  const compDomains = bundle.competitiveContext.competitorDomains

  const youLabel = intake.primaryBusinessName.slice(0, 20)
  const yourPosition = serviceSearch
    ? resultsMentionDomain(serviceSearch.results, buyerHost)
    : null
  const snapshots = bundle.competitiveContext.competitorSnapshots
  const yourPsi = bundle.digitalPresence.pageSpeed.mobileScore
  const yourGbp =
    bundle.digitalPresence.gbp.rating != null
      ? `${bundle.digitalPresence.gbp.rating}★ (${bundle.digitalPresence.gbp.reviewCount ?? "?"} reviews)`
      : bundle.digitalPresence.gbp.found
        ? "Listed"
        : "—"

  const competitiveGrid =
    compDomains.length > 0
      ? {
          columnHeaders: [`You (${youLabel})`, ...compDomains],
          rows: [
            {
              label: "Page 1 on service search",
              cells: [
                yourPosition ? `#${yourPosition.position}` : "Not in top 10",
                ...compDomains.map((d) => {
                  const hit = serviceSearch?.results.find((r) =>
                    r.link.toLowerCase().includes(d),
                  )
                  return hit ? `#${hit.position}` : "—"
                }),
              ],
              youColumnIndex: 0,
            },
            {
              label: `Review signal (${TERMS.serp})`,
              cells: [
                yourGbp,
                ...compDomains.map((d) => {
                  const snap = snapshots.find((s) => s.domain === d)
                  if (!snap?.rating) return snap?.reviewSnippet?.slice(0, 40) ?? "—"
                  return `${snap.rating}★${snap.reviewCount != null ? ` (${snap.reviewCount})` : ""}`
                }),
              ],
              youColumnIndex: 0,
            },
            {
              label: "Homepage title",
              cells: [
                site.title?.slice(0, 36) ?? "—",
                ...compDomains.map((d) => {
                  const snap = snapshots.find((s) => s.domain === d)
                  return snap?.homepageTitle?.slice(0, 36) ?? "—"
                }),
              ],
              youColumnIndex: 0,
            },
            {
              label: `Mobile score (${TERMS.pageSpeed})`,
              cells: [
                yourPsi != null ? `${yourPsi}/100` : "—",
                ...compDomains.map(() => "—"),
              ],
              youColumnIndex: 0,
            },
          ],
        }
      : undefined

  const competitiveFindings = [
    {
      label: `Service search — "${serviceSearch?.query ?? intake.primaryService}"`,
      value:
        compDomains.length > 0
          ? `Top domains on page 1 include: ${compDomains.join(", ")}`
          : "Competitor domains could not be inferred.",
      detail: serviceSearch?.results.length
        ? formatTopResults(serviceSearch.results)
        : (serviceSearch?.limitation ?? ""),
      severity: "medium" as const,
    },
  ]

  const aiOverview = bundle.searchFootprint.searches.find((s) => s.aiOverview)?.aiOverview

  return [
    {
      id: "search_footprint",
      label: "Search footprint",
      ...scoreFromFindings(searchFindings),
      findings: searchFindings,
      aiPreview: [
        {
          platform: TERMS.aiOverview,
          result: aiOverview ?? `No ${TERMS.aiOverview} snippet returned for footprint queries.`,
          severity: aiOverview ? ("medium" as const) : ("high" as const),
        },
        {
          platform: "ChatGPT / Perplexity",
          result:
            `Live AI citation checks are not automated in v1; improve entity clarity on site and ${TERMS.gbp}.`,
          severity: "medium" as const,
        },
      ],
    },
    {
      id: "online_reputation",
      label: "Reputation",
      ...scoreFromFindings(reputationFindings),
      findings: reputationFindings,
    },
    {
      id: "digital_presence",
      label: "Digital presence",
      ...scoreFromFindings(digitalFindings),
      findings: digitalFindings,
      scoreRows: digitalScoreRows,
    },
    {
      id: "revenue_funnel",
      label: "Revenue funnel diagnosis",
      ...scoreFromFindings(funnelFindings),
      findings: funnelFindings,
    },
    {
      id: "competitive_context",
      label: "Competitive context snapshot",
      ...scoreFromFindings(competitiveFindings),
      findings: competitiveFindings,
      competitiveGrid,
    },
  ]
}

export function buildExecutiveSummaryFromResearch(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  sections: ReportSection[],
): import("@/lib/pipeline/report-types").LevelstackReportJson["executiveSummary"] {
  const allFindings = sections.flatMap((s) => s.findings)
  const critical =
    allFindings.find((f) => f.severity === "critical" || f.severity === "high") ??
    allFindings[0]

  const serpNote = hasSerpData(bundle)
    ? "Findings are based on live Google search results and your website signals as of this report date."
    : "Limited search data was returned; findings lean on intake answers."

  const searchSection = sections.find((s) => s.id === "search_footprint")
  const topSearchFinding = searchSection?.findings[0]
  const researchExample = topSearchFinding?.value
    ? truncateReportCopy(topSearchFinding.value, 200)
    : topSearchFinding?.detail
      ? truncateReportCopy(topSearchFinding.detail, 220)
      : ""

  const paragraphs: string[] = [
    `When prospects search for ${intake.ownerName} or ${businessNameForSearch(intake)} in a ${marketLocationLabel(intake) ?? intake.geoMarket} market, the first screen shapes trust before they book ${intake.primaryService} at ${intake.pricePoint}. ${serpNote}${researchExample ? ` From public research so far: ${researchExample}` : ""}`,
  ]

  const highSelfRating = intake.reputationScale >= 8
  const hasNegativeSignals = allFindings.some(
    (f) =>
      f.severity === "critical" ||
      f.severity === "high" ||
      /not in top|complaint|negative|unclaimed|weak/i.test(`${f.value} ${f.detail}`),
  )

  if (highSelfRating && hasNegativeSignals) {
    paragraphs.push(
      `You rated reputation ${intake.reputationScale}/10, but public search signals suggest prospects may see mixed or weaker trust cues than you expect (${intake.complaintsAwareness.slice(0, 120) || "no specific complaints flagged in intake"}). Closing that perception gap is often faster than adding more traffic.`,
    )
  } else {
    paragraphs.push(
      `You rated reputation ${intake.reputationScale}/10. Intake note: ${intake.complaintsAwareness.slice(0, 200) || "none"}.`,
    )
  }

  if (intake.hasActiveAdSpend === "yes") {
    paragraphs.push(
      `You reported active ad spend (${intake.adPlatforms ?? "paid channels"}, ~${intake.adBudget ?? "budget not specified"}). If landing page trust or message match is weak, a portion of that spend may reach clicks that never convert — fix trust signals before scaling budget.`,
    )
  }

  paragraphs.push(
    "This report is diagnostic only — LevelStack identifies gaps; you or your team execute fixes. No ranking or revenue outcomes are guaranteed.",
  )

  const whatProspectsSee = paragraphs[0] ?? ""
  const reputationGap = paragraphs[1] ?? ""
  const revenueRisk =
    intake.hasActiveAdSpend === "yes" && paragraphs[2]
      ? paragraphs[2]
      : paragraphs.find((p) => /ad spend|paid|convert/i.test(p)) ??
        `Conversion risk remains if trust signals and offer clarity do not match what prospects see in search for ${intake.primaryService}.`

  const distinct = computeDistinctHighlightsFromSections(
    sections,
    intake.primaryBusinessName,
    {
      primaryService: intake.primaryService,
      criticalIssue: critical?.value,
    },
  )

  return {
    paragraphs,
    criticalIssue: distinct.criticalIssue,
    firstSteps: [],
    insights: {
      whatProspectsSee,
      reputationGap,
      revenueRisk,
    },
    highlights: {
      businessImpact: distinct.businessImpact,
      highestLeverageOpportunity: distinct.highestLeverageOpportunity,
    },
    strengths: distinct.strengths.length > 0 ? distinct.strengths : undefined,
    topOpportunities:
      distinct.topOpportunities.length > 0 ? distinct.topOpportunities : undefined,
  }
}

function gbpLocationMismatch(
  intake: LevelstackIntakeFormValues,
  address: string | null,
): boolean {
  const city = intake.marketCity?.trim()
  if (!city || !address) return false
  return !address.toLowerCase().includes(city.toLowerCase())
}

function buildReputationFindings(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
): ReportSection["findings"] {
  const findings: ReportSection["findings"] = []

  for (const search of bundle.reputation.searches) {
    if (!search.results.length && !search.limitation) continue
    const platform = platformFromQuery(search.query)
    const hit = bestReputationHit(search.results, search.query)

    if (hit) {
      const { rating, reviewCount } = hit.parsed
      findings.push({
        label: platform ? `${platform} visibility` : search.query.slice(0, 48),
        value:
          rating != null
            ? `${hit.result.title.slice(0, 80)} — ${rating}★${reviewCount != null ? `, ${reviewCount} reviews cited` : ""}`
            : hit.result.title.slice(0, 100),
        detail: `${hit.result.link} · ${hit.result.snippet.slice(0, 200)}`,
        severity:
          rating != null && rating < 4
            ? ("critical" as const)
            : rating != null && rating < 4.3
              ? ("high" as const)
              : ("medium" as const),
      })
    } else if (search.limitation) {
      findings.push({
        label: platform ?? "Reputation search",
        value: search.limitation.slice(0, 100),
        detail: `Query: ${search.query}`,
        severity: "medium",
      })
    }
  }

  if (findings.length === 0) {
    findings.push({
      label: "Review-oriented search",
      value: "No platform-specific review snippets captured.",
      detail: intake.complaintsAwareness.slice(0, 300),
      severity: intake.reputationScale <= 6 ? "high" : "medium",
    })
  }

  return findings.slice(0, 5)
}

function buildSocialFindings(
  bundle: ResearchBundle,
): ReportSection["findings"] {
  const signals = bundle.digitalPresence.social.filter((s) => s.url)
  if (signals.length === 0) {
    const lim = bundle.digitalPresence.social[0]?.limitation
    return lim
      ? [
          {
            label: "Social profiles",
            value: "Could not parse profile URLs",
            detail: lim,
            severity: "medium" as const,
          },
        ]
      : []
  }

  return signals.map((s) => ({
    label: s.platform,
    value: s.pageTitle ?? s.url,
    detail: [s.recencyHint, s.limitation].filter(Boolean).join(" "),
    severity: s.limitation ? ("medium" as const) : ("good" as const),
  }))
}

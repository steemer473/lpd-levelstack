import type { LevelstackIntakeFormValues } from "@/lib/intake/schema"
import { businessNameForSearch, marketLocationLabel } from "@/lib/intake/location"
import {
  bestReputationHit,
  findOwnSiteReputationResult,
  formatReputationQueryLabel,
  isB2bReviewDirectoryPlatform,
  platformFromQuery,
} from "@/lib/research/reputation-parse"
import type { CompetitiveComparisonMode } from "@/lib/research/serp/competitor-resolve"
import {
  COMPARISON_SOURCE_LABELS,
  competitiveSectionLabel,
  formatSerpEvidenceTable,
} from "@/lib/research/serp/competitor-resolve"
import { formatBrandSerpEvidence } from "@/lib/research/serp/brand-serp-evidence"
import type { SerpOrganicResult } from "@/lib/research/serp"
import {
  filterCompetitorDomains,
  hostnameFromUrl,
  resultsMentionDomain,
} from "@/lib/research/serp"
import type { ResearchBundle } from "@/lib/pipeline/research-types"
import type { ReportFinding, ReportSection } from "@/lib/pipeline/report-types"
import { buildAiOverviewCheck } from "@/lib/pipeline/ai-overview-check"
import {
  classifyLimitationAvailability,
  isNotFetchedYet,
  isUnavailableSearchCheck,
  scoreSectionFromChecks,
  type SectionCheck,
} from "@/lib/pipeline/check-availability"
import {
  businessSearchSeverity,
  ownerSearchSeverity,
} from "@/lib/pipeline/search-finding-severity"
import { TERMS } from "@/lib/report/customer-terms"
import {
  customerGbpFindingDetail,
  customerGbpFindingValue,
  customerLimitationText,
  isInternalLimitation,
  UNABLE_TO_VERIFY_DETAIL,
  UNABLE_TO_VERIFY_VALUE,
} from "@/lib/report/customer-copy"
import { computeDistinctHighlightsFromSections } from "@/lib/report/executive-dedup"
import { truncateReportCopy } from "@/lib/report/format-report-copy"

type ScoreRow = NonNullable<ReportSection["scoreRows"]>[number]

function titleForDomain(
  results: SerpOrganicResult[],
  domain: string,
): string | undefined {
  const hit = results.find((r) => {
    try {
      return hostnameFromUrl(r.link) === domain
    } catch {
      return false
    }
  })
  return hit?.title
}

function hasSerpData(bundle: ResearchBundle): boolean {
  return (
    bundle.searchFootprint.searches.some((s) => s.results.length > 0) ||
    bundle.socialSearch.platforms.length > 0 ||
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

  const businessUnavailable =
    Boolean(businessSearch) && isUnavailableSearchCheck(businessSearch!)
  const businessSeverity = businessUnavailable
    ? ("medium" as const)
    : businessSearchSeverity(
        businessHit,
        Boolean(businessSearch?.results.length),
      )
  const businessAvailability: SectionCheck["availability"] = businessUnavailable
    ? classifyLimitationAvailability(businessSearch?.limitation)
    : businessHit
      ? "ok"
      : "negative"

  const ownerUnavailable =
    Boolean(ownerSearch) && isUnavailableSearchCheck(ownerSearch!)
  const ownerSeverity = ownerUnavailable
    ? ("medium" as const)
    : ownerSearchSeverity(ownerSearch?.results ?? [], buyerHost)
  const ownerAvailability: SectionCheck["availability"] = ownerUnavailable
    ? classifyLimitationAvailability(ownerSearch?.limitation)
    : ownerSearch?.results.length
      ? ownerSeverity === "good" || ownerSeverity === "low"
        ? "ok"
        : "negative"
      : "negative"

  const searchFindings: ReportFinding[] = [
    {
      label: `Google — "${businessQuery}"`,
      value: businessHit
        ? `Your site appears around position #${businessHit.position}`
        : businessSearch?.results.length
          ? "Your website was not in the top 10 organic results for this query."
          : customerLimitationText(
              businessSearch?.limitation,
              UNABLE_TO_VERIFY_VALUE,
            ),
      detail: businessSearch?.results.length
        ? [
            "These are the brand-relevant Google results prospects see.",
            formatBrandSerpEvidence(
              businessSearch.results,
              buyerHost,
              intake.primaryBusinessName,
            ),
          ]
            .filter(Boolean)
            .join(" ")
        : businessSearch?.limitation
          ? customerLimitationText(
              businessSearch.limitation,
              UNABLE_TO_VERIFY_DETAIL,
            )
          : "",
      severity: businessSeverity,
    },
    {
      label: `Google — "${intake.ownerName}"`,
      value:
        ownerSearch?.results.length
          ? `When someone searches your name, page 1 shows: ${ownerSearch.results[0]?.title ?? "mixed results"}`
          : ownerUnavailable
            ? customerLimitationText(
                ownerSearch?.limitation,
                UNABLE_TO_VERIFY_VALUE,
              )
            : "No organic results captured when searching your owner name.",
      detail: ownerSearch?.results.length
        ? formatBrandSerpEvidence(
            ownerSearch.results,
            buyerHost,
            intake.ownerName,
          ) ||
          formatBrandSerpEvidence(
            ownerSearch.results,
            buyerHost,
            intake.primaryBusinessName,
          )
        : ownerSearch?.limitation
          ? customerLimitationText(
              ownerSearch.limitation,
              UNABLE_TO_VERIFY_DETAIL,
            )
          : "",
      severity: ownerSeverity,
    },
  ]
  const aiOverviewCheck = buildAiOverviewCheck(intake, bundle)
  const searchChecks: SectionCheck[] = [
    { availability: businessAvailability, severity: businessSeverity },
    { availability: ownerAvailability, severity: ownerSeverity },
    aiOverviewCheck.check,
  ]

  const { findings: reputationFindings, checks: reputationChecks } =
    buildReputationFindings(intake, bundle, buyerHost)

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

  const siteNotChecked = isNotFetchedYet(site.limitation)
  const siteUnavailable =
    !siteNotChecked &&
    Boolean(site.limitation) &&
    isInternalLimitation(site.limitation) &&
    !site.title
  const siteSeverity: ReportFinding["severity"] =
    site.title && site.metaDescription && site.h1
      ? "good"
      : site.title
        ? "low"
        : "high"
  const siteAvailability: SectionCheck["availability"] = siteNotChecked
    ? "not_checked"
    : siteUnavailable
      ? "unavailable"
      : siteSeverity === "good" || siteSeverity === "low"
        ? "ok"
        : "negative"

  const digitalFindings: ReportFinding[] = [
    {
      label: "Homepage signals",
      value: site.title
        ? `First impression on your homepage: Title: “${site.title}”`
        : siteUnavailable || siteNotChecked
          ? customerLimitationText(site.limitation, UNABLE_TO_VERIFY_VALUE)
          : "Could not read your homepage title.",
      detail: [
        site.metaDescription ? `${TERMS.metaDescription}: ${site.metaDescription}` : null,
        site.h1 ? `${TERMS.mainHeading}: ${site.h1}` : null,
        site.limitation
          ? customerLimitationText(site.limitation, "")
          : null,
      ]
        .filter(Boolean)
        .join(" "),
      severity: siteSeverity,
    },
  ]
  const digitalChecks: SectionCheck[] = [
    { availability: siteAvailability, severity: siteSeverity },
  ]

  if (psi.mobileScore != null) {
    const psiSeverity: ReportFinding["severity"] =
      psi.mobileScore < 50
        ? "critical"
        : psi.mobileScore < 70
          ? "high"
          : "medium"
    digitalFindings.push({
      label: "Mobile site speed",
      value: `Mobile site speed: ${psi.mobileScore}/100 (Lighthouse)`,
      detail: [
        psi.lcp ? `${TERMS.lcp}: ${psi.lcp}` : null,
        psi.cls ? `${TERMS.cls}: ${psi.cls}` : null,
        `Source: ${TERMS.pageSpeed} (mobile). 70+ is healthy; under 50 often feels broken on phones.`,
      ]
        .filter(Boolean)
        .join(" "),
      severity: psiSeverity,
    })
    digitalChecks.push({
      availability: psi.mobileScore >= 70 ? "ok" : "negative",
      severity: psiSeverity,
    })
  } else if (psi.limitation) {
    const psiAvailability = classifyLimitationAvailability(psi.limitation)
    digitalFindings.push({
      label: "Mobile site speed",
      value:
        psiAvailability === "not_checked"
          ? "Mobile site speed was not checked for this report"
          : `${TERMS.pageSpeed} data unavailable`,
      detail:
        psiAvailability === "not_checked"
          ? "PageSpeed runs on the full Action Roadmap report."
          : customerLimitationText(psi.limitation, UNABLE_TO_VERIFY_DETAIL),
      severity: "medium",
    })
    digitalChecks.push({ availability: psiAvailability, severity: "medium" })
  }

  const gbpNotChecked = isNotFetchedYet(gbp.limitation)
  const gbpUnavailable =
    !gbp.found &&
    Boolean(gbp.limitation) &&
    isInternalLimitation(gbp.limitation) &&
    !gbpNotChecked

  if (gbp.found) {
    const gbpSeverity: ReportFinding["severity"] = gbpLocationMismatch(
      intake,
      gbp.address,
    )
      ? "high"
      : (gbp.reviewCount ?? 0) < 5 || (gbp.rating ?? 5) < 4
        ? "high"
        : "good"
    digitalFindings.push({
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
      severity: gbpSeverity,
    })
    digitalChecks.push({
      availability: gbpSeverity === "good" ? "ok" : "negative",
      severity: gbpSeverity,
    })
  } else {
    const gbpSeverity: ReportFinding["severity"] =
      gbpNotChecked || gbpUnavailable ? "medium" : "high"
    digitalFindings.push({
      label: TERMS.gbp,
      value: customerGbpFindingValue(gbp, intake.primaryBusinessName),
      detail: customerGbpFindingDetail(gbp, TERMS.gbp),
      severity: gbpSeverity,
    })
    digitalChecks.push({
      availability: gbpNotChecked
        ? "not_checked"
        : gbpUnavailable
          ? "unavailable"
          : "negative",
      severity: gbpSeverity,
    })
  }

  // P0-3: social findings live in social_offsite, not digital_presence

  // Fix digital score rows for GBP not_checked
  const digitalScoreRowsFixed: ScoreRow[] = digitalScoreRows.map((row) => {
    if (row.label !== TERMS.gbp || gbp.found) return row
    if (gbpNotChecked) {
      return {
        label: TERMS.gbp,
        value: "Not checked on this tier",
        percent: 50,
        tone: "amber" as const,
      }
    }
    if (gbpUnavailable) {
      return {
        label: TERMS.gbp,
        value: "Unable to verify",
        percent: 50,
        tone: "amber" as const,
      }
    }
    return row
  })

  const runsAds = intake.hasActiveAdSpend === "yes"
  const funnelPsi = bundle.revenueFunnel.pageSpeed
  const funnelFindings: ReportFinding[] = [
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
  ]
  const funnelChecks: SectionCheck[] = [
    {
      availability: "negative",
      severity: site.hasCtaLanguage ? "low" : "medium",
    },
  ]
  // Homepage CTA check is always "checked" from research — ok if strong CTA
  funnelChecks[0]!.availability = site.hasCtaLanguage ? "ok" : "negative"

  if (runsAds) {
    const adSeverity: ReportFinding["severity"] = site.hasCtaLanguage
      ? "high"
      : "critical"
    funnelFindings.push({
      label: "Paid traffic → landing",
      value: `Active ad spend (${intake.adPlatforms ?? "paid"} ~${intake.adBudget ?? "budget not specified"})`,
      detail: [
        "Prospects who click ads land on your site before they trust you from search.",
        site.hasCtaLanguage
          ? `Homepage shows some ${TERMS.cta} language; still verify message match with ad copy and offer.`
          : `Weak homepage ${TERMS.cta} and trust signals increase wasted spend — consider pausing scale until landing is fixed.`,
      ].join(" "),
      severity: adSeverity,
    })
    funnelChecks.push({ availability: "negative", severity: adSeverity })
  }

  const legacyDomains = bundle.competitiveContext.competitorDomains
  const compColumns =
    bundle.competitiveContext.competitorColumns.length > 0
      ? bundle.competitiveContext.competitorColumns
      : filterCompetitorDomains(legacyDomains, buyerHost).map((domain) => ({
          domain,
          source: "service_peer" as const,
          title: titleForDomain(serviceSearch?.results ?? [], domain),
        }))
  const compDomains = compColumns.map((c) => c.domain)
  const comparisonMode: CompetitiveComparisonMode =
    compColumns.length > 0
      ? bundle.competitiveContext.comparisonMode === "evidence_only"
        ? "service_peer"
        : bundle.competitiveContext.comparisonMode
      : "evidence_only"

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
  const yourCategory = bundle.digitalPresence.gbp.category ?? "—"

  const columnHeaders =
    compDomains.length > 0
      ? [
          `You (${youLabel})`,
          ...compColumns.map((c) => c.title?.slice(0, 28) ?? c.domain),
        ]
      : []

  const competitiveGrid =
    compDomains.length > 0
      ? {
          comparisonMode,
          columnSources: [
            "you" as const,
            ...compColumns.map((c) => c.source),
          ],
          columnHeaders,
          rows: [
            {
              label: "Comparison type",
              cells: [
                "Your business",
                ...compColumns.map((c) => COMPARISON_SOURCE_LABELS[c.source]),
              ],
              youColumnIndex: 0,
            },
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
              label: "Business category",
              cells: [
                yourCategory,
                ...compDomains.map(() => "—"),
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

  const primaryCompetitorName =
    compColumns[0]?.title ?? compColumns[0]?.domain ?? null

  const competitiveFindings: ReportFinding[] = [
    {
      label: `Service search — "${serviceSearch?.query ?? intake.primaryService}"`,
      value:
        compDomains.length > 0
          ? comparisonMode === "service_peer"
            ? `Top domains on page 1 include: ${compDomains.join(", ")}`
            : primaryCompetitorName
              ? `No direct service-search peers on page 1 — comparing to ${primaryCompetitorName} (${compDomains[0]}) via ${COMPARISON_SOURCE_LABELS[compColumns[0]!.source].toLowerCase()}`
              : `Comparable entities: ${compDomains.join(", ")}`
          : "No direct competitor domains on page 1 for this query — see page-1 evidence below.",
      detail: serviceSearch?.results.length
        ? formatSerpEvidenceTable(serviceSearch.results)
        : serviceSearch?.limitation
          ? customerLimitationText(
              serviceSearch.limitation,
              UNABLE_TO_VERIFY_DETAIL,
            )
          : "Run a service-market search with identifiable business competitors to populate this section.",
      severity: "medium" as const,
    },
  ]
  const serviceUnavailable =
    Boolean(serviceSearch) && isUnavailableSearchCheck(serviceSearch!)
  const competitiveChecks: SectionCheck[] = [
    {
      availability: serviceUnavailable
        ? classifyLimitationAvailability(serviceSearch?.limitation)
        : "negative",
      severity: "medium",
    },
  ]

  if (compDomains.length === 0 && serviceSearch?.results.length) {
    competitiveFindings.push({
      label: "Page 1 evidence (service search)",
      value:
        "Directories and platforms dominate page 1 — no peer business domains qualified for side-by-side comparison.",
      detail: formatSerpEvidenceTable(serviceSearch.results),
      severity: "medium",
    })
    competitiveChecks.push({ availability: "negative", severity: "medium" })
  }

  const socialOffsite = buildSocialOffsiteFromSearch(bundle)

  return [
    {
      id: "search_footprint",
      label: "Search footprint",
      ...scoreSectionFromChecks(searchChecks),
      findings: searchFindings,
      aiPreview: aiOverviewCheck.aiPreview,
    },
    {
      id: "social_offsite",
      label: "Social & off-site presence",
      ...scoreSectionFromChecks(socialOffsite.checks),
      findings: socialOffsite.findings,
    },
    {
      id: "online_reputation",
      label: "Reputation",
      ...scoreSectionFromChecks(reputationChecks),
      findings: reputationFindings,
    },
    {
      id: "digital_presence",
      label: "Digital presence",
      ...scoreSectionFromChecks(digitalChecks),
      findings: digitalFindings,
      scoreRows: digitalScoreRowsFixed,
    },
    {
      id: "revenue_funnel",
      label: "Revenue funnel diagnosis",
      ...scoreSectionFromChecks(funnelChecks),
      findings: funnelFindings,
    },
    {
      id: "competitive_context",
      label: competitiveSectionLabel(comparisonMode),
      ...scoreSectionFromChecks(competitiveChecks),
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

type ReputationSearch = ResearchBundle["reputation"]["searches"][number]

type ReputationHitContext = {
  businessName: string
  ownerName: string
  buyerHost: string | null
}

function pushFindingFromReputationSearch(
  search: ReputationSearch,
  repContext: ReputationHitContext,
  findings: ReportFinding[],
  checks: SectionCheck[],
): void {
  if (!search.results.length && !search.limitation) return

  const hit = bestReputationHit(search.results, search.query, repContext)
  const ownSite = findOwnSiteReputationResult(search.results, repContext)
  const label = formatReputationQueryLabel(search.query)

  if (hit) {
    const { rating, reviewCount, platform } = hit.parsed
    const platformLabel = platform ?? "public listing"

    if (rating != null) {
      const severity: ReportFinding["severity"] =
        rating < 4 ? "critical" : rating < 4.2 ? "high" : "good"
      findings.push({
        label,
        value: `${rating}★${reviewCount != null ? ` (${reviewCount} reviews cited)` : ""} on ${platformLabel}`,
        detail: `Listing: ${hit.result.title.slice(0, 80)} · ${hit.result.link}. Google shows: ${hit.result.snippet.slice(0, 160)}`,
        severity,
      })
      checks.push({
        availability: severity === "good" ? "ok" : "negative",
        severity,
      })
    } else {
      findings.push({
        label,
        value: "No star rating or review count appeared in search results",
        detail: `Top relevant result: ${hit.result.title.slice(0, 80)} · ${hit.result.link}. Google shows: ${hit.result.snippet.slice(0, 160)}`,
        severity: "high",
      })
      checks.push({ availability: "negative", severity: "high" })
    }
  } else if (ownSite) {
    findings.push({
      label,
      value:
        "No review profile found — your website ranks instead of third-party reviews",
      detail: `When prospects search for reviews, Google shows your homepage first: ${ownSite.link}. Google shows: ${ownSite.snippet.slice(0, 180)}`,
      severity: "high",
    })
    checks.push({ availability: "negative", severity: "high" })
  } else if (search.results.length > 0) {
    findings.push({
      label,
      value: `No review listings found for "${search.query.replace(/\s+reviews?$/i, "").trim()}"`,
      detail:
        "Unrelated directory and list pages were filtered out. Prospects searching for reviews may not see credible third-party proof.",
      severity: "high",
    })
    checks.push({ availability: "negative", severity: "high" })
  } else if (search.limitation) {
    const availability = classifyLimitationAvailability(search.limitation)
    findings.push({
      label,
      value: customerLimitationText(search.limitation, UNABLE_TO_VERIFY_VALUE),
      detail: `We searched Google for: ${search.query}`,
      severity: "medium",
    })
    checks.push({ availability, severity: "medium" })
  }
}

type B2bPlatformStatus = {
  platform: string
  status: "found" | "missing" | "unavailable" | "not_checked"
  link?: string
  rating?: number | null
  reviewCount?: number | null
  severity?: ReportFinding["severity"]
}

function buildB2bDirectoryClusterFinding(
  searches: ReputationSearch[],
  repContext: ReputationHitContext,
): { finding: ReportFinding; check: SectionCheck } | null {
  if (searches.length === 0) return null

  const statuses: B2bPlatformStatus[] = []

  for (const search of searches) {
    const platform = platformFromQuery(search.query) ?? "Directory"
    if (!search.results.length && !search.limitation) {
      statuses.push({ platform, status: "not_checked" })
      continue
    }

    const hit = bestReputationHit(search.results, search.query, repContext)
    if (hit) {
      const { rating, reviewCount } = hit.parsed
      const severity: ReportFinding["severity"] =
        rating == null
          ? "high"
          : rating < 4
            ? "critical"
            : rating < 4.2
              ? "high"
              : "good"
      statuses.push({
        platform,
        status: "found",
        link: hit.result.link,
        rating,
        reviewCount,
        severity,
      })
    } else if (search.limitation) {
      const availability = classifyLimitationAvailability(search.limitation)
      statuses.push({
        platform,
        status: availability === "not_checked" ? "not_checked" : "unavailable",
      })
    } else {
      statuses.push({ platform, status: "missing", severity: "high" })
    }
  }

  const found = statuses.filter((s) => s.status === "found")
  const missing = statuses.filter((s) => s.status === "missing")
  const blocked = statuses.filter(
    (s) => s.status === "unavailable" || s.status === "not_checked",
  )

  const detailParts = statuses.map((s) => {
    if (s.status === "found") {
      const stars =
        s.rating != null
          ? `${s.rating}★${s.reviewCount != null ? ` (${s.reviewCount} reviews)` : ""}`
          : "listing found"
      return `${s.platform}: ${stars}${s.link ? ` · ${s.link}` : ""}`
    }
    if (s.status === "missing") return `${s.platform}: no matching profile on page 1`
    if (s.status === "not_checked") return `${s.platform}: not checked for this report`
    return `${s.platform}: unable to verify`
  })

  if (blocked.length === statuses.length) {
    return {
      finding: {
        label: "B2B review directories (Clutch / G2 / Capterra)",
        value: customerLimitationText(null, UNABLE_TO_VERIFY_VALUE),
        detail: detailParts.join(" · "),
        severity: "medium",
      },
      check: {
        availability: blocked.every((s) => s.status === "not_checked")
          ? "not_checked"
          : "unavailable",
        severity: "medium",
      },
    }
  }

  const worstFoundSeverity = found.reduce<ReportFinding["severity"]>(
    (worst, s) => {
      const sev = s.severity ?? "high"
      const rank = { critical: 4, high: 3, medium: 2, low: 1, good: 0 }
      return rank[sev] > rank[worst] ? sev : worst
    },
    "good",
  )

  let severity: ReportFinding["severity"] = "high"
  let value: string
  if (found.length > 0 && missing.length === 0) {
    severity = worstFoundSeverity
    value =
      severity === "good"
        ? `Profiles found on ${found.map((s) => s.platform).join(", ")}`
        : `Weak or incomplete B2B review presence (${found.map((s) => s.platform).join(", ")})`
  } else if (found.length > 0) {
    severity =
      worstFoundSeverity === "good" && missing.length > 0
        ? "high"
        : worstFoundSeverity === "good"
          ? "medium"
          : worstFoundSeverity
    value = `Found on ${found.map((s) => s.platform).join(", ")}; missing ${missing.map((s) => s.platform).join(", ")}`
  } else {
    severity = "high"
    value = `No Clutch / G2 / Capterra profiles found (${missing.map((s) => s.platform).join(", ") || "searched"})`
  }

  return {
    finding: {
      label: "B2B review directories (Clutch / G2 / Capterra)",
      value,
      detail: detailParts.join(" · "),
      severity,
    },
    check: {
      availability: severity === "good" ? "ok" : "negative",
      severity,
    },
  }
}

function buildReputationFindings(
  intake: LevelstackIntakeFormValues,
  bundle: ResearchBundle,
  buyerHost: string | null,
): { findings: ReportFinding[]; checks: SectionCheck[] } {
  const findings: ReportFinding[] = []
  const checks: SectionCheck[] = []
  const repContext: ReputationHitContext = {
    businessName: intake.primaryBusinessName,
    ownerName: intake.ownerName,
    buyerHost,
  }

  const b2bSearches: ReputationSearch[] = []
  const otherSearches: ReputationSearch[] = []

  for (const search of bundle.reputation.searches) {
    const platform = platformFromQuery(search.query)
    if (isB2bReviewDirectoryPlatform(platform)) {
      b2bSearches.push(search)
    } else {
      otherSearches.push(search)
    }
  }

  const clustered = buildB2bDirectoryClusterFinding(b2bSearches, repContext)
  if (clustered) {
    findings.push(clustered.finding)
    checks.push(clustered.check)
  }

  for (const search of otherSearches) {
    pushFindingFromReputationSearch(search, repContext, findings, checks)
  }

  if (findings.length === 0) {
    const severity: ReportFinding["severity"] =
      intake.reputationScale <= 6 ? "high" : "medium"
    findings.push({
      label: "Review-oriented search",
      value: "No platform-specific review snippets captured.",
      detail: [
        "We searched Google for review and reputation queries tied to your business.",
        intake.complaintsAwareness.slice(0, 220),
      ]
        .filter(Boolean)
        .join(" "),
      severity,
    })
    checks.push({ availability: "negative", severity })
  }

  return {
    findings: findings.slice(0, 5),
    checks: checks.slice(0, 5),
  }
}

/** P0-3: genuine Social & off-site section from socialSearch SERP (not digital_presence). */
function buildSocialOffsiteFromSearch(
  bundle: ResearchBundle,
): { findings: ReportFinding[]; checks: SectionCheck[] } {
  const platforms = bundle.socialSearch.platforms
  if (platforms.length === 0) {
    return {
      findings: [
        {
          label: "Social platforms",
          value: "Social platform search was not completed",
          detail:
            "We could not verify LinkedIn, Facebook, or other social profiles for this report.",
          severity: "medium",
        },
      ],
      checks: [{ availability: "not_checked", severity: "medium" }],
    }
  }

  const findings: ReportFinding[] = []
  const checks: SectionCheck[] = []
  for (const p of platforms) {
    if (p.found) {
      findings.push({
        label: p.platform,
        value: p.title ?? p.url ?? `${p.platform} profile found`,
        detail: p.url
          ? p.source === "website" || p.source === "intake"
            ? `Confirmed via a ${p.platform} link on your ${p.source === "intake" ? "intake" : "website"}: ${p.url}`
            : `Public search returned a ${p.platform} result that matches your brand: ${p.url}`
          : `${p.platform} presence detected for your brand.`,
        severity: "good",
      })
      checks.push({ availability: "ok", severity: "good" })
    } else {
      findings.push({
        label: p.platform,
        value: `No clear ${p.platform} profile matched your brand in search`,
        detail: `We searched ${p.platform} for your brand and domain. Nothing in the top results clearly matched — unrelated profiles that rank for similar words are excluded.`,
        severity: "high",
      })
      checks.push({ availability: "negative", severity: "high" })
    }
  }
  return { findings, checks }
}

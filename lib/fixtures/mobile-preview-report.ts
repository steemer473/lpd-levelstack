import type { LevelstackReportJson } from "@/lib/pipeline/report-types"

/** Stable free-tier report for dev preview and mobile e2e tests. */
export const MOBILE_PREVIEW_FREE_REPORT: LevelstackReportJson = {
  meta: {
    businessName: "Preview Plumbing Co",
    ownerName: "Jordan Lee",
    marketLabel: "Atlanta, GA",
    reportDate: "June 30, 2026",
    planId: "levelstack-free-snapshot",
    reportTier: "free_snapshot",
    overallScore: 68,
    letterGrade: "D",
    totalFindings: 5,
    criticalCount: 1,
    highCount: 1,
    mediumCount: 2,
    lowCount: 1,
    issueCountForUpgrade: 4,
  },
  executiveSummary: {
    paragraphs: [
      "Prospects see mixed signals when they search for Preview Plumbing Co.",
      "Review volume trails top competitors in Atlanta.",
      "Paid traffic may leak before the landing page converts.",
    ],
    criticalIssue: "Homepage trust signals are weak for Preview Plumbing Co.",
    firstSteps: ["Fix landing CTA", "Add Google reviews widget"],
    insights: {
      whatProspectsSee:
        "When prospects search Preview Plumbing Co, a competitor appears above you on Google.",
      reputationGap:
        "You have fewer recent reviews than the top plumber showing in local results.",
      revenueRisk:
        "Active ad spend may waste budget until landing page trust and CTA are fixed.",
    },
    highlights: {
      businessImpact:
        "Weak homepage trust reduces paid and organic conversion for Preview Plumbing Co.",
      highestLeverageOpportunity:
        "Fix landing CTA and trust signals before scaling ad spend.",
    },
    strengths: ["Branded search shows your domain on page 1"],
    topOpportunities: ["Add social proof above the fold", "Improve mobile speed"],
  },
  sections: [
    {
      id: "search_footprint",
      label: "Search footprint",
      status: "attention",
      score: 60,
      findings: [
        {
          label: "Google",
          value: "Not in top 10 for service terms",
          detail:
            "Top results: #1 Rival Plumbing (https://rival-plumbing.example); #2 Other (https://other.example)",
          severity: "high",
        },
      ],
    },
    {
      id: "online_reputation",
      label: "Reputation",
      status: "attention",
      score: 72,
      findings: [
        {
          label: "Google reviews",
          value: "12 reviews, 4.2 average",
          detail: "Top competitor shows 84 reviews at 4.8.",
          severity: "medium",
        },
      ],
    },
    {
      id: "digital_presence",
      label: "Digital presence",
      status: "attention",
      score: 65,
      findings: [
        {
          label: "Mobile speed",
          value: "Lighthouse mobile score: 58/100",
          detail: "Scores under 70 feel sluggish on phones.",
          severity: "high",
        },
      ],
    },
    {
      id: "revenue_funnel",
      label: "Revenue funnel",
      status: "attention",
      score: 58,
      findings: [
        {
          label: "Landing page",
          value: "No phone number above the fold",
          detail: "Prospects must scroll to find contact options.",
          severity: "critical",
        },
      ],
    },
    {
      id: "competitive_context",
      label: "Competitive context",
      status: "attention",
      score: 55,
      findings: [
        {
          label: 'Service search — "plumber Atlanta"',
          value: "Competitors ahead",
          detail: "#1 Rival Plumbing (https://rival-plumbing.example)",
          severity: "medium",
        },
      ],
      competitiveGrid: {
        columnHeaders: ["You", "rival-plumbing.example"],
        rows: [
          {
            label: "Page 1 on service search",
            cells: ["Not in top 10", "#1"],
            youColumnIndex: 0,
          },
          {
            label: "Google reviews",
            cells: ["12 @ 4.2", "84 @ 4.8"],
            youColumnIndex: 0,
          },
        ],
      },
    },
  ],
  actionPlan: {
    thisWeek: [
      { task: "Add phone CTA above fold", who: "You", time: "30m" },
      { task: "Request 5 Google reviews", who: "You", time: "1h" },
      { task: "Compress hero images", who: "Dev", time: "2h" },
    ],
    thisMonth: [],
    thisQuarter: [],
  },
}

/** Paid-tier variant for competitive grid mobile scroll tests. */
export const MOBILE_PREVIEW_PAID_REPORT: LevelstackReportJson = {
  ...MOBILE_PREVIEW_FREE_REPORT,
  meta: {
    ...MOBILE_PREVIEW_FREE_REPORT.meta,
    reportTier: "full_report",
    planId: "levelstack-standard",
  },
}

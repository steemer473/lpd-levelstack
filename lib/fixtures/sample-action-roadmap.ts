import type { LevelstackReportJson } from "@/lib/pipeline/report-types"
import { SAMPLE_REPORT } from "@/lib/fixtures/sample-report"

/**
 * Illustrative paid Action Roadmap for public `/sample-report/action-roadmap`.
 * Continues the Marcus Carter / MC Fitness story from SAMPLE_REPORT so free and
 * paid samples read as one continuous business.
 *
 * Deep: action_plan (via inherited buckets) + competitive_context grid.
 * Brief but present: online_reputation, digital_presence, revenue_funnel —
 * every paid tab must exist so none hits the empty-state rebuild message.
 *
 * Recommendations omitted so ActionPlanPanel renders the full legacy Who/Time
 * matrix across thisWeek / thisMonth / thisQuarter.
 */
export const SAMPLE_ACTION_ROADMAP: LevelstackReportJson = {
  ...SAMPLE_REPORT,
  meta: {
    ...SAMPLE_REPORT.meta,
    planId: "levelstack-standard",
    reportTier: "full_report",
    overallScore: 61,
    letterGrade: "D",
    totalFindings: 22,
    criticalCount: 5,
    highCount: 6,
    mediumCount: 7,
    lowCount: 4,
    lockedSectionCount: 0,
    issueCountForUpgrade: undefined,
    teaserActionCount: undefined,
  },
  sections: [
    ...SAMPLE_REPORT.sections,
    {
      id: "online_reputation",
      label: "Reputation",
      status: "critical",
      score: 48,
      findings: [
        {
          label: "Google Business Profile reviews",
          value: "3.2★ from 6 reviews — 2 unanswered negatives",
          detail:
            "Last review arrived 9 months ago. ATL Fit Pro shows 48 reviews at 4.8 stars for overlapping service searches. Unanswered negatives sit next to the star rating prospects see first.",
          severity: "critical",
        },
        {
          label: "Yelp listing",
          value: "Unclaimed auto-generated page",
          detail:
            "Phone and hours are incomplete. Prospects who land here see a thin profile with no photos while nearby coaches show claimed, current listings.",
          severity: "high",
        },
        {
          label: "ConsumerAffairs complaint (prior name)",
          value: "2022 billing dispute still indexed for personal-name search",
          detail:
            "Filed under Carter Fitness Studio LLC. Two upvotes and one follow-up comment. It ranks above mcfitness.example when someone searches Marcus Carter.",
          severity: "critical",
        },
      ],
    },
    {
      id: "digital_presence",
      label: "Digital presence",
      status: "attention",
      score: 55,
      findings: [
        {
          label: "Mobile page speed",
          value: "Lighthouse mobile 61",
          detail:
            "Services page is the ad landing destination. On a mid-range phone the hero and form take long enough that warm paid clicks often leave before booking.",
          severity: "high",
        },
        {
          label: "Google Business Profile completeness",
          value: "Missing photos, posts, and full service list",
          detail:
            "Profile exists and is claimed. Photos, Google posts, and a complete service list are the highest-weight incomplete fields for local discovery.",
          severity: "medium",
        },
        {
          label: "Homepage meta description",
          value: "Default template copy on primary pages",
          detail:
            'Current description reads like a site scaffold: "Welcome to MC Fitness & Wellness | Services | Contact." No city, offer, or reason to click.',
          severity: "medium",
        },
      ],
    },
    {
      id: "revenue_funnel",
      label: "Revenue funnel",
      status: "critical",
      score: 42,
      findings: [
        {
          label: "Paid traffic destination",
          value: "$1,200/mo ads → services page with no social proof",
          detail:
            "Facebook and Instagram ads land on a page with a 9-field booking form, no testimonials above the fold, and mobile score 61. Warm clicks hit friction before any conversion event.",
          severity: "critical",
        },
        {
          label: "Lead capture",
          value: "340 email subscribers — no site list growth path",
          detail:
            "Traffic that is not ready to book has nowhere to go. No lead magnet or email capture on the primary landing path.",
          severity: "high",
        },
        {
          label: "Offer clarity on landing page",
          value: "$197/mo coaching is not explained above the fold",
          detail:
            "Price and outcome are buried. Prospects comparing coaches decide from the first screen — yours does not state what they get or for whom.",
          severity: "medium",
        },
      ],
    },
    {
      id: "competitive_context",
      label: "Competitive context",
      status: "attention",
      score: 52,
      findings: [
        {
          label: 'Service search — "online fitness coach Atlanta"',
          value: "You: not in top 3. ATL Fit Pro #1 organic. FitLife Atlanta #2.",
          detail:
            "Page 1 is led by ATL Fit Pro (organic), FitLife Atlanta (organic), and a Yelp aggregator. Your domain appears later with template meta copy. Neither rival targets corporate wellness — that lane is open.",
          severity: "high",
        },
        {
          label: "Review volume vs rivals",
          value: "You: 6 reviews. ATL Fit Pro: 48. FitLife Atlanta: 22.",
          detail:
            "Prospects comparing options weigh review count and recency. Your last review is 9 months old; both rivals show recent activity.",
          severity: "high",
        },
        {
          label: "Positioning gap",
          value: "Corporate wellness untaken by top rivals",
          detail:
            "Neither ATL Fit Pro nor FitLife Atlanta markets B2B / HR wellness packages. Revenue per engagement on that lane is typically higher than consumer coaching.",
          severity: "medium",
        },
      ],
      competitiveGrid: {
        columnHeaders: [
          "You (MC Fitness)",
          "ATL Fit Pro",
          "FitLife Atlanta",
        ],
        columnSources: ["you", "service_peer", "service_peer"],
        comparisonMode: "service_peer",
        rows: [
          {
            label: "Page 1 rank",
            cells: ["Not in top 3", "#1", "#2"],
            youColumnIndex: 0,
          },
          {
            label: "Review signal",
            cells: ["3.2★ · 6 reviews", "4.8★ · 48 reviews", "4.5★ · 22 reviews"],
            youColumnIndex: 0,
          },
          {
            label: "Homepage title",
            cells: [
              "MC Fitness & Wellness | Services | Contact",
              "ATL Fit Pro — Online Coaching Atlanta",
              "FitLife Atlanta Personal Training",
            ],
            youColumnIndex: 0,
          },
          {
            label: "Mobile score",
            cells: ["61", "88", "79"],
            youColumnIndex: 0,
          },
          {
            label: "Corporate wellness",
            cells: ["Not positioned", "Not offered", "Not offered"],
            youColumnIndex: 0,
          },
        ],
      },
    },
  ],
  // Omit free-tier teaser recommendations so the full action plan matrix renders.
  recommendations: undefined,
}

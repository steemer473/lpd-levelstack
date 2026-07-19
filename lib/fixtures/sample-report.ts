import type { LevelstackReportJson } from "@/lib/pipeline/report-types"

/**
 * Illustrative free-tier report for public `/sample-report` marketing preview.
 * Copy ported from legacy assets/levelstack-sample-report.html (Marcus Carter / MC Fitness).
 */
export const SAMPLE_REPORT: LevelstackReportJson = {
  meta: {
    businessName: "MC Fitness & Wellness",
    ownerName: "Marcus Carter",
    marketLabel: "Atlanta, GA",
    reportDate: "June 2, 2026",
    planId: "levelstack-free-snapshot",
    reportTier: "free_snapshot",
    overallScore: 68,
    letterGrade: "C",
    totalFindings: 14,
    criticalCount: 4,
    highCount: 3,
    mediumCount: 5,
    lowCount: 2,
    issueCountForUpgrade: 10,
    lockedSectionCount: 5,
    upgradeTeasers: {
      competitivePositionAlert:
        "ATL Fit Pro ranks above you for primary service searches in Atlanta.",
      competitiveSearchQuery: "online fitness coach Atlanta",
      competitorCount: 2,
      previewCompetitor: {
        rank: 1,
        domain: "atlfitpro.com",
        title: "ATL Fit Pro",
      },
    },
    teaserActionCount: 14,
  },
  executiveSummary: {
    paragraphs: [
      "Prospects researching Marcus Carter and MC Fitness & Wellness see mixed signals before they ever reach your site.",
      "A 2022 complaint under a prior business name still ranks above your website for personal-name searches.",
      "You are spending $1,200/month on ads sending warm traffic to a landing page that is not ready to convert.",
    ],
    criticalIssue:
      "A ConsumerAffairs complaint from 2022 ranks above your website when prospects search your personal name.",
    firstSteps: [
      "Respond to both negative Google reviews",
      "Pause ad spend until the landing page is updated",
      "Post to Instagram to break the 91-day gap",
    ],
    insights: {
      whatProspectsSee:
        'When prospects search "Marcus Carter" or "MC Fitness Atlanta," a 2022 ConsumerAffairs complaint appears above your website. For service terms, you rank #4 behind Planet Fitness, Anytime Fitness Atlanta, and a Yelp aggregator — with a generic meta description that does not differentiate your offer.',
      reputationGap:
        "Google Business Profile shows 3.2 stars from 6 reviews — last review 9 months ago. Two negative reviews are unanswered. ATL Fit Pro shows 48 reviews at 4.8 stars. Your Yelp profile is unclaimed.",
      revenueRisk:
        "$1,200/month in Facebook and Instagram ads lands on a services page with no social proof, a 61 mobile Lighthouse score, and a 9-field booking form. LevelStack estimates 60–70% of warm clicks are lost before any action.",
    },
    highlights: {
      businessImpact:
        "Low review count, unanswered negatives, and an unready landing page reduce trust for prospects evaluating a $197/month coaching program.",
      highestLeverageOpportunity:
        "Pause ad spend, add testimonials and a lead capture offer to the site, then resume paid acquisition once mobile performance reaches 80+.",
    },
    strengths: [
      "2,400 Instagram followers exceed both primary Atlanta competitors",
      "Branded search shows your domain on page 1 for service terms",
      "No active BBB complaints on file",
    ],
    topOpportunities: [
      "Respond to negative reviews and launch a review generation campaign",
      "Claim and complete Yelp and Google Business Profile",
      "Build corporate wellness positioning — neither competitor targets B2B",
    ],
  },
  sections: [
    {
      id: "search_footprint",
      label: "Search footprint",
      status: "critical",
      score: 74,
      findings: [
        {
          label: 'Google page 1 — "Marcus Carter" (personal name)',
          value: "3rd result: complaint post on ConsumerAffairs.com",
          detail:
            'A complaint filed in 2022 under a prior business ("Carter Fitness Studio LLC") is still indexed and appearing prominently. It ranks above your own website for your personal name. The complaint references a billing dispute and has two upvotes and one follow-up comment.',
          severity: "critical",
        },
        {
          label: 'Google page 1 — "MC Fitness Atlanta" (primary service)',
          value: "Your website ranks #4. Competitors in positions 1–3.",
          detail:
            'The top three positions are held by Planet Fitness (ad), Anytime Fitness Atlanta (organic), and a Yelp aggregator page that does not mention your business. Your site appears at position 4 with a meta description that reads as a default template — "Welcome to MC Fitness & Wellness | Services | Contact." No differentiation, no location, no call to action.',
          severity: "high",
        },
      ],
      aiPreview: [
        {
          platform: "Google AI Overview",
          result:
            'Query "personal trainer Atlanta online" surfaces an AI Overview with 4 citations. Your site is not one of them. No FAQ schema, no structured Q&A content detected.',
          severity: "high",
        },
      ],
    },
    {
      id: "social_offsite",
      label: "Social & off-site presence",
      status: "attention",
      score: 62,
      findings: [
        {
          label: "LinkedIn",
          value: "Company profile found in search",
          detail:
            "A LinkedIn company result appears for MC Fitness & Wellness. Profile completeness was not verified on this free snapshot.",
          severity: "good",
        },
        {
          label: "Facebook",
          value: "No Facebook profile found in search",
          detail:
            "Prospects searching for your brand on Facebook may not find a clear page — competitors with visible profiles win those clicks.",
          severity: "high",
        },
        {
          label: "Instagram (intake)",
          value: "2,400 followers · Last post 91 days ago",
          detail:
            "Your follower count is solid for your market. The 91-day gap in posting is what prospect research surfaces — a dormant account reads as a dormant business.",
          severity: "medium",
        },
      ],
    },
  ],
  actionPlan: {
    thisWeek: [
      {
        task: "Respond to both negative Google reviews",
        sub: "Acknowledge the concern, offer direct contact. Removes the unanswered signal that amplifies doubt for new prospects.",
        who: "You",
        time: "30 min",
      },
      {
        task: "Pause Facebook/Instagram ad spend until the landing page is updated",
        sub: "You are spending $1,200/month sending warm traffic to a page that cannot convert. Fix the destination before resuming paid acquisition.",
        who: "You",
        time: "15 min",
      },
      {
        task: "Claim and complete your Yelp profile",
        sub: "Add correct phone, services, hours, and 2–3 photos. Prevents the auto-generated page from being the only version prospects find.",
        who: "You",
        time: "45 min",
      },
      {
        task: "Post one piece of content to Instagram today",
        sub: "Break the 91-day gap. A single real post signals that the business is active to anyone researching you.",
        who: "You",
        time: "20 min",
      },
    ],
    thisMonth: [
      {
        task: "Rewrite services page hero and add 3 client testimonials above the fold",
        sub: "Price point ($197/month) cannot be defended without social proof. Testimonials must include a result, not just a rating.",
        who: "You / Freelancer",
        time: "4–6 hrs",
      },
      {
        task: "Add a lead capture offer to your website",
        sub: "You have 340 email subscribers and no mechanism to grow the list from site traffic.",
        who: "You / Freelancer",
        time: "3–4 hrs",
      },
      {
        task: "Complete Google Business Profile — add 5 photos, list all services, publish first Google post",
        sub: "Photos and posts are the two highest-weight incomplete fields for your profile.",
        who: "You",
        time: "2 hrs",
      },
      {
        task: "Fix mobile site performance (Lighthouse 61 → target 80+)",
        sub: "More than 70% of your target audience will land on your site from a phone.",
        who: "Freelancer / Developer",
        time: "4–8 hrs",
      },
    ],
    thisQuarter: [
      {
        task: "Add FAQ section structured for AI search citation",
        sub: "ChatGPT, Perplexity, and Google AI Overview currently do not surface your business.",
        who: "You / Freelancer",
        time: "3–5 hrs",
      },
      {
        task: "Pursue removal or suppression of the ConsumerAffairs complaint",
        sub: "The 2022 complaint indexes above your website for your personal name.",
        who: "You",
        time: "3–6 hrs",
      },
      {
        task: "Generate 20 new Google reviews from current and past clients",
        sub: "6 reviews at 3.2 average works against you. Email your 340 subscribers with a direct review request.",
        who: "You",
        time: "2 hrs outreach",
      },
      {
        task: "Build corporate wellness landing page and resume ad spend targeting HR",
        sub: "Neither competitor targets corporate wellness. Revenue per engagement is 2–4x your consumer offer.",
        who: "You / Freelancer",
        time: "10–15 hrs",
      },
    ],
  },
}

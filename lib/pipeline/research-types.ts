import type { BrandMentionSignals } from "@/lib/research/brand-mentions"
import type { AboutFooterSignals } from "@/lib/research/about-footer"
import type { SocialPlatformResult } from "@/lib/research/social-search"
import type { CompetitorSnapshot } from "@/lib/research/competitor"
import type { GbpSignals } from "@/lib/research/gbp"
import type { PageSpeedSignals } from "@/lib/research/pagespeed"
import type { SocialProfileSignal } from "@/lib/research/social"
import type { SerpSearchResponse } from "@/lib/research/serp"
import type { WebsiteExtendedSignals, WebsiteSignals } from "@/lib/research/website"
import type { InsightSeverity } from "@/lib/audit/types"

export type SubdomainFinding = {
  hostname: string
  reason: string
  severity: "low" | "medium" | "high"
}

export type NameCollision = {
  title: string
  link: string
  type: "direct_competitor" | "adjacent_brand" | "generic_term"
}

export type InfrastructureLeakInstance = {
  url: string
  finding: string
  severity: "low" | "medium" | "high"
  remediation: string
}

export type ResearchBundle = {
  /** Op 1 — Brand name search */
  searchFootprint: {
    searches: SerpSearchResponse[]
    reportDate: string
  }
  /** Op 2 — Primary domain fetch (also in digitalPresence.website) */
  primaryDomain: {
    website: WebsiteSignals
    extended: WebsiteExtendedSignals | null
  }
  /** Op 3 — Social media search */
  socialSearch: {
    platforms: SocialPlatformResult[]
  }
  /** Op 4 — About / footer fetch */
  aboutFooter: AboutFooterSignals
  /** Op 5 — Directory & review search */
  reputation: {
    searches: SerpSearchResponse[]
  }
  /** Op 6 — Brand mention search */
  brandMentions: BrandMentionSignals
  digitalPresence: {
    website: WebsiteSignals
    websiteExtended: WebsiteExtendedSignals | null
    pageSpeed: PageSpeedSignals
    gbp: GbpSignals
    social: SocialProfileSignal[]
    socialProfilesFromIntake: string
  }
  revenueFunnel: {
    website: WebsiteSignals
    pageSpeed: PageSpeedSignals
    intakeNotes: string
  }
  competitiveContext: {
    serviceSearch: SerpSearchResponse | null
    competitorDomains: string[]
    buyerHostname: string | null
    competitorSnapshots: CompetitorSnapshot[]
  }
  subdomainExposure: {
    subdomains: SubdomainFinding[]
  }
  nameCollisions: {
    collisions: NameCollision[]
    severity: InsightSeverity
  }
  infrastructureLeakage: {
    instances: InfrastructureLeakInstance[]
  }
}

const emptyWebsite: WebsiteSignals = {
  url: "",
  title: null,
  metaDescription: null,
  h1: null,
  usesHttps: false,
  hasCtaLanguage: false,
  wordCountApprox: 0,
  limitation: "Not fetched yet.",
}

const emptyPageSpeed: PageSpeedSignals = {
  mobileScore: null,
  lcp: null,
  cls: null,
  limitation: "Not fetched yet.",
}

const emptyGbp: GbpSignals = {
  found: false,
  title: null,
  rating: null,
  reviewCount: null,
  address: null,
  category: null,
  limitation: "Not fetched yet.",
}

export function emptyResearchBundle(): ResearchBundle {
  const reportDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return {
    searchFootprint: { searches: [], reportDate },
    primaryDomain: { website: { ...emptyWebsite }, extended: null },
    socialSearch: { platforms: [] },
    aboutFooter: {
      aboutUrl: null,
      footerSocialLinks: [],
      contactEmail: null,
      contactPhone: null,
      companyNarrative: null,
      limitation: null,
    },
    brandMentions: { mentions: [], limitation: null },
    reputation: { searches: [] },
    digitalPresence: {
      website: { ...emptyWebsite },
      websiteExtended: null,
      pageSpeed: { ...emptyPageSpeed },
      gbp: { ...emptyGbp },
      social: [],
      socialProfilesFromIntake: "",
    },
    revenueFunnel: {
      website: { ...emptyWebsite },
      pageSpeed: { ...emptyPageSpeed },
      intakeNotes: "",
    },
    competitiveContext: {
      serviceSearch: null,
      competitorDomains: [],
      buyerHostname: null,
      competitorSnapshots: [],
    },
    subdomainExposure: { subdomains: [] },
    nameCollisions: { collisions: [], severity: "low" },
    infrastructureLeakage: { instances: [] },
  }
}

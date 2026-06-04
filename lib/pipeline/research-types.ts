import type { CompetitorSnapshot } from "@/lib/research/competitor"
import type { GbpSignals } from "@/lib/research/gbp"
import type { PageSpeedSignals } from "@/lib/research/pagespeed"
import type { SocialProfileSignal } from "@/lib/research/social"
import type { SerpSearchResponse } from "@/lib/research/serp"
import type { WebsiteSignals } from "@/lib/research/website"

export type ResearchBundle = {
  searchFootprint: {
    searches: SerpSearchResponse[]
    reportDate: string
  }
  reputation: {
    searches: SerpSearchResponse[]
  }
  digitalPresence: {
    website: WebsiteSignals
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
    reputation: { searches: [] },
    digitalPresence: {
      website: { ...emptyWebsite },
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
  }
}

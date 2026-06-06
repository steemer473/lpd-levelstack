/**
 * Customer-facing labels: full term first, acronym in parentheses.
 * Use in findings, score rows, section guides, and synthesis prompts.
 */
export const TERMS = {
  gbp: "Google Business Profile (GBP)",
  cta: "Call to action (CTA)",
  pageSpeed: "Google PageSpeed Insights",
  lcp: "Largest Contentful Paint (LCP)",
  cls: "Cumulative Layout Shift (CLS)",
  serp: "Search engine results page (SERP)",
  nap: "Name, address, and phone (NAP)",
  aiOverview: "Google AI Overview",
  metaDescription: "Meta description",
  mainHeading: "Main heading (H1)",
  https: "Secure site (HTTPS)",
} as const

/** Map short keys from pipeline detail strings to display labels */
export const DETAIL_KEY_LABELS: Record<string, string> = {
  Meta: TERMS.metaDescription,
  "Meta description": TERMS.metaDescription,
  H1: TERMS.mainHeading,
  "Main heading (H1)": TERMS.mainHeading,
  H2: "Subheading (H2)",
  "Subheading (H2)": "Subheading (H2)",
  LCP: TERMS.lcp,
  "Largest Contentful Paint (LCP)": TERMS.lcp,
  CLS: TERMS.cls,
  "Cumulative Layout Shift (CLS)": TERMS.cls,
  FID: "First Input Delay (FID)",
  "First Input Delay (FID)": "First Input Delay (FID)",
  Query: "Search query",
  "Search query": "Search query",
  Title: "Page title",
  "Page title": "Page title",
}

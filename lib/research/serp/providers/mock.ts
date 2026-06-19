import type {
  MapsPlaceResult,
  ProviderMapsResult,
  ProviderOrganicResult,
  SerpOrganicResult,
} from "@/lib/research/serp/types"

function slugFromQuery(query: string): string {
  const stripped = query
    .replace(/site:[^\s]+/gi, "")
    .replace(/["']/g, "")
    .trim()
  const words = stripped.split(/\s+/).slice(0, 3)
  return words.join("-").toLowerCase().replace(/[^a-z0-9-]/g, "") || "business"
}

function businessLabelFromQuery(query: string): string {
  const stripped = query
    .replace(/site:[^\s]+/gi, "")
    .replace(/["']/g, "")
    .replace(/\breviews?\b/gi, "")
    .replace(/\bcomplaints?\b/gi, "")
    .trim()
  const parts = stripped.split(/\s+/).filter(Boolean)
  return parts.slice(0, 4).join(" ") || "Example Business"
}

function mockOrganicResults(query: string): SerpOrganicResult[] {
  const label = businessLabelFromQuery(query)
  const slug = slugFromQuery(query)
  const domain = `${slug}.example`

  return [
    {
      query,
      position: 1,
      title: `${label} — Official Website`,
      link: `https://www.${domain}.com/`,
      snippet: `${label} provides professional services. Visit our website for details.`,
    },
    {
      query,
      position: 2,
      title: `${label} | LinkedIn`,
      link: `https://www.linkedin.com/company/${slug}`,
      snippet: `Learn about ${label} on LinkedIn.`,
    },
    {
      query,
      position: 3,
      title: `${label} Reviews`,
      link: `https://www.yelp.com/biz/${slug}`,
      snippet: `Customer reviews for ${label}.`,
    },
  ]
}

export async function mockOrganicSearch(query: string): Promise<ProviderOrganicResult> {
  return {
    response: {
      query,
      results: mockOrganicResults(query),
      aiOverview: null,
      limitation: null,
    },
    shouldFailover: false,
  }
}

export async function mockMapsSearch(query: string): Promise<ProviderMapsResult> {
  const label = businessLabelFromQuery(query)
  const place: MapsPlaceResult = {
    title: label,
    rating: 4.6,
    reviewCount: 42,
    address: "123 Main St, Example City, ST 12345",
    category: "Professional services",
    limitation: null,
  }
  return { place, shouldFailover: false }
}

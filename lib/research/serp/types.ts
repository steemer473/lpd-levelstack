export type SerpOrganicResult = {
  query: string
  position: number
  title: string
  link: string
  snippet: string
}

export type SerpSearchResponse = {
  query: string
  results: SerpOrganicResult[]
  aiOverview: string | null
  limitation: string | null
}

export type SerpEngine = "google" | "google_maps"

export type SerpProviderId = "serpapi" | "searchapi" | "dataforseo" | "mock"

export type MapsPlaceResult = {
  title: string | null
  rating: number | null
  reviewCount: number | null
  address: string | null
  category: string | null
  limitation: string | null
}

export type ProviderOrganicResult = {
  response: SerpSearchResponse
  httpStatus?: number
  shouldFailover: boolean
}

export type ProviderMapsResult = {
  place: MapsPlaceResult
  httpStatus?: number
  shouldFailover: boolean
}

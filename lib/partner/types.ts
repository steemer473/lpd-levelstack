export type PartnerBranding = {
  companyName: string
  logoUrl?: string | null
  accentColorHex: string
  customDomain?: string | null
}

export type PartnerRecord = PartnerBranding & {
  partnerSlug: string
}

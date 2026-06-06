import type { SupabaseClient } from "@supabase/supabase-js"

import type { PartnerBranding } from "@/lib/partner/types"

export async function getPartnerBrandingBySlug(
  supabase: SupabaseClient,
  slug: string | null | undefined,
): Promise<PartnerBranding | null> {
  if (!slug?.trim()) return null

  const { data, error } = await supabase
    .from("levelstack_partner_branding")
    .select("company_name, logo_url, accent_color_hex, custom_domain")
    .eq("partner_slug", slug.trim())
    .maybeSingle()

  if (error || !data) return null

  return {
    companyName: data.company_name,
    logoUrl: data.logo_url,
    accentColorHex: data.accent_color_hex,
    customDomain: data.custom_domain,
  }
}

import type { SupabaseClient } from "@supabase/supabase-js"

import { requirePaidIntakeAccess } from "@/lib/levelstack-access"
import { createAdminClient } from "@/lib/supabase/admin"

export type EntitlementStatus = {
  paid: boolean
  signedInEmail: string | null
  /** Present when an order exists for this reportId but belongs to a different account. */
  checkoutEmailHint: string | null
  mismatch: boolean
}

/**
 * Paid intake gate plus upgrade email-mismatch diagnostics for /intake?from=upgrade.
 */
export async function getEntitlementStatus(
  supabase: SupabaseClient,
  userId: string,
  signedInEmail: string | null,
  reportId?: string,
): Promise<EntitlementStatus> {
  const paid = await requirePaidIntakeAccess(supabase, userId)
  if (paid || !reportId) {
    return {
      paid,
      signedInEmail,
      checkoutEmailHint: null,
      mismatch: false,
    }
  }

  const admin = createAdminClient()
  if (!admin) {
    return {
      paid: false,
      signedInEmail,
      checkoutEmailHint: null,
      mismatch: false,
    }
  }

  const { data: orders } = await admin
    .from("orders")
    .select("user_id, metadata, created_at")
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(25)

  const match = (orders ?? []).find((row) => {
    const meta = row.metadata as Record<string, unknown> | null
    return meta?.levelstackReportId === reportId
  })

  if (!match || match.user_id === userId) {
    return {
      paid: false,
      signedInEmail,
      checkoutEmailHint: null,
      mismatch: false,
    }
  }

  const meta = match.metadata as Record<string, unknown> | null
  const metaEmail =
    (typeof meta?.checkoutEmail === "string" && meta.checkoutEmail.trim().toLowerCase()) ||
    (typeof meta?.userEmail === "string" && meta.userEmail.trim().toLowerCase()) ||
    null

  let checkoutEmailHint = metaEmail || null
  if (!checkoutEmailHint && match.user_id) {
    const { data: profile } = await admin
      .from("user_profiles")
      .select("email")
      .eq("id", match.user_id)
      .maybeSingle()
    checkoutEmailHint = profile?.email?.trim().toLowerCase() || null
  }

  return {
    paid: false,
    signedInEmail,
    checkoutEmailHint,
    mismatch: true,
  }
}

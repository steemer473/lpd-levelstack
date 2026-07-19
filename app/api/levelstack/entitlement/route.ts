import { NextRequest, NextResponse } from "next/server"

import { getEntitlementStatus } from "@/lib/levelstack/entitlement-status"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.json({ paid: false }, { status: 500 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ paid: false }, { status: 401 })
  }

  const reportId = request.nextUrl.searchParams.get("reportId")?.trim() || undefined
  const status = await getEntitlementStatus(
    supabase,
    user.id,
    user.email?.trim().toLowerCase() ?? null,
    reportId,
  )

  return NextResponse.json(status)
}

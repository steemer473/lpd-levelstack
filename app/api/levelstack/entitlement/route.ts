import { NextResponse } from "next/server"

import { requirePaidIntakeAccess } from "@/lib/levelstack-access"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
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

  const paid = await requirePaidIntakeAccess(supabase, user.id)
  return NextResponse.json({ paid })
}

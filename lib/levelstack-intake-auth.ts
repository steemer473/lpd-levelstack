import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"

import { hasLevelStackAccess } from "@/lib/levelstack-access"
import { createClient } from "@/lib/supabase/server"
import { getHubPricingUrl } from "@/lib/urls"

const intakeSecurityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
}

export type LevelStackIntakeAuthResult =
  | { ok: true; user: User }
  | { ok: false; response: NextResponse }

export async function requireLevelStackIntakeAccess(): Promise<LevelStackIntakeAuthResult> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: "Authentication is not configured." },
        { status: 500, headers: intakeSecurityHeaders },
      ),
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, message: "Sign in is required." },
        { status: 401, headers: intakeSecurityHeaders },
      ),
    }
  }

  const hasAccess = await hasLevelStackAccess(supabase, user.id)
  if (!hasAccess) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          message: "A completed LevelStack purchase is required.",
          purchaseUrl: getHubPricingUrl(),
        },
        { status: 403, headers: intakeSecurityHeaders },
      ),
    }
  }

  return { ok: true, user }
}

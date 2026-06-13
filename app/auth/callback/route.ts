import { type EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

async function verifyMagicLinkToken(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  tokenHash: string,
  type: EmailOtpType,
) {
  return supabase.auth.verifyOtp({ type, token_hash: tokenHash })
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = (searchParams.get("type") ?? "magiclink") as EmailOtpType
  const next = searchParams.get("next") ?? "/intake"

  const supabase = await createClient()
  if (!supabase) {
    return NextResponse.redirect(new URL("/auth/sign-in", origin))
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
    console.error("[auth/callback] exchangeCodeForSession:", error.message)
  }

  if (token_hash) {
    const { error } = await verifyMagicLinkToken(supabase, token_hash, type)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }

    if (type !== "email") {
      const fallback = await verifyMagicLinkToken(supabase, token_hash, "email")
      if (!fallback.error) {
        return NextResponse.redirect(new URL(next, origin))
      }
      console.error("[auth/callback] verifyOtp:", fallback.error.message)
    } else {
      console.error("[auth/callback] verifyOtp:", error.message)
    }
  }

  const signIn = new URL("/auth/sign-in", origin)
  signIn.searchParams.set("error", "auth")
  if (next.startsWith("/")) {
    signIn.searchParams.set("redirect", next)
  }
  return NextResponse.redirect(signIn)
}

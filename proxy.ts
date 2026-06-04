import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

import { env } from "@/env.mjs"
import { hasLevelStackAccess } from "@/lib/levelstack-access"
import { updateSession } from "@/lib/supabase/middleware"

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const sessionResponse = await updateSession(request)

  const isProtectedProductRoute =
    pathname === "/intake" ||
    pathname.startsWith("/intake/") ||
    pathname === "/api/intake" ||
    pathname.startsWith("/reports/")

  const isAuthRoute = pathname.startsWith("/auth/")

  if (!isProtectedProductRoute || isAuthRoute) {
    return sessionResponse
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    return sessionResponse
  }

  let response = sessionResponse
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const signInUrl = request.nextUrl.clone()
    signInUrl.pathname = "/auth/sign-in"
    signInUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(signInUrl)
  }

  const hasAccess = await hasLevelStackAccess(supabase, user.id)
  if (!hasAccess) {
    const denied = request.nextUrl.clone()
    denied.pathname = "/purchase-required"
    return NextResponse.redirect(denied)
  }

  return response
}

export const config = {
  matcher: ["/intake", "/intake/:path*", "/reports/:path*", "/api/intake"],
}

import { type NextRequest, NextResponse } from "next/server"

import {
  reportAccessCookieName,
  verifyReportAccessToken,
} from "@/lib/auth/report-access-token"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ reportId: string }> }

/**
 * Exchanges a signed report access token (from an emailed magic link) for an
 * HttpOnly cookie, then redirects to the clean report (or print) URL. Keeping
 * the token off the destination URL avoids leaking it via browser history,
 * server logs, and the Referer header. Invalid/expired tokens fall through to
 * the normal sign-in wall.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { reportId } = await context.params
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get("rtoken")
  const to = searchParams.get("to")

  const claims = verifyReportAccessToken(token, reportId)

  if (!claims) {
    const signIn = new URL("/auth/sign-in", origin)
    signIn.searchParams.set("redirect", `/reports/${reportId}`)
    return NextResponse.redirect(signIn)
  }

  const destination =
    to === "print" ? `/reports/${reportId}/print` : `/reports/${reportId}`
  const response = NextResponse.redirect(new URL(destination, origin))

  const maxAge = Math.max(0, claims.expiresAt - Math.floor(Date.now() / 1000))
  response.cookies.set({
    name: reportAccessCookieName(reportId),
    value: token as string,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  })

  return response
}

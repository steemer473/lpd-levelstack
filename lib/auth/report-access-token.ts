import { createHmac, timingSafeEqual } from "node:crypto"

import { env } from "@/env.mjs"
import type { ReportTier } from "@/lib/levelstack-plans"

/**
 * Possession-based report access tokens.
 *
 * These are independent of Supabase OTP magic links. A signed token lets the
 * recipient of a report email open their report (and its PDF) from any device
 * for the token's lifetime, even after the single-use Supabase OTP is consumed
 * or expired. Access is read-only; all mutations still require real auth.
 *
 * Token shape: `{reportId}.{tier}.{expiryUnixSeconds}.{base64url(hmac)}`
 * where hmac = HMAC-SHA256(secret, "{reportId}:{tier}:{expiry}").
 *
 * Tier is bound into the signature on purpose: an upgrade reuses the same
 * `reportId` row and flips `report_tier` from free_snapshot to full_report
 * (see lib/intake/upgrade-free-snapshot.ts), so a stale free-snapshot token
 * must NOT unlock the upgraded paid report. Callers compare the decoded tier
 * against the report's current tier before granting access.
 */

/** 30 days — possession access to one's own report, not a login session. */
export const REPORT_ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30

export const REPORT_ACCESS_TOKEN_TTL_LABEL = "30 days"

const VALID_TIERS: readonly ReportTier[] = [
  "free_snapshot",
  "full_report",
  "strategy_call",
]

export type ReportAccessTokenClaims = {
  reportId: string
  tier: ReportTier
  expiresAt: number
}

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

function getSecret(): string | null {
  return env.LEVELSTACK_REPORT_TOKEN_SECRET ?? null
}

function computeSignature(
  secret: string,
  reportId: string,
  tier: string,
  expiry: number,
): string {
  return base64url(
    createHmac("sha256", secret).update(`${reportId}:${tier}:${expiry}`).digest(),
  )
}

function isReportTier(value: string): value is ReportTier {
  return (VALID_TIERS as readonly string[]).includes(value)
}

/**
 * Mint a report access token. Returns null when the signing secret is unset
 * (fail closed — no secret means no possession-based access).
 */
export function signReportAccessToken(
  reportId: string,
  tier: ReportTier,
  ttlSeconds: number = REPORT_ACCESS_TOKEN_TTL_SECONDS,
): string | null {
  const secret = getSecret()
  if (!secret) return null

  const expiry = Math.floor(Date.now() / 1000) + ttlSeconds
  const sig = computeSignature(secret, reportId, tier, expiry)
  return `${reportId}.${tier}.${expiry}.${sig}`
}

/**
 * Verify a report access token against a specific reportId. Confirms the
 * signature, expiry, and reportId binding using a constant-time compare.
 * Returns decoded claims (including the bound tier) or null.
 *
 * The caller MUST still confirm `claims.tier` matches the report's current
 * tier before serving paid content.
 */
export function verifyReportAccessToken(
  token: string | null | undefined,
  reportId: string,
): ReportAccessTokenClaims | null {
  if (!token) return null
  const secret = getSecret()
  if (!secret) return null

  const parts = token.split(".")
  if (parts.length !== 4) return null

  const [tokenReportId, tier, expiryRaw, sig] = parts
  if (!tokenReportId || !tier || !expiryRaw || !sig) return null
  if (tokenReportId !== reportId) return null
  if (!isReportTier(tier)) return null

  const expiry = Number.parseInt(expiryRaw, 10)
  if (!Number.isFinite(expiry)) return null
  if (expiry < Math.floor(Date.now() / 1000)) return null

  const expectedSig = computeSignature(secret, tokenReportId, tier, expiry)
  const provided = Buffer.from(sig)
  const expected = Buffer.from(expectedSig)
  if (provided.length !== expected.length) return null
  if (!timingSafeEqual(provided, expected)) return null

  return { reportId: tokenReportId, tier, expiresAt: expiry }
}

/** Per-report HttpOnly cookie name set by the access route after token exchange. */
export function reportAccessCookieName(reportId: string): string {
  return `lvlstk_ra_${reportId}`
}

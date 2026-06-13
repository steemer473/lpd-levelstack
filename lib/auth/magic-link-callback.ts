import { getAppUrl } from "@/lib/urls"

/** Server-verifiable magic link — uses hashed_token, not Supabase action_link (hash fragments). */
export function buildMagicLinkCallbackUrl(
  hashedToken: string,
  nextPath: string,
): string {
  const params = new URLSearchParams({
    token_hash: hashedToken,
    type: "magiclink",
    next: nextPath,
  })
  return getAppUrl(`/auth/callback?${params.toString()}`)
}

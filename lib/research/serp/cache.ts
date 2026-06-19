import { createHash } from "node:crypto"

import { createAdminClient } from "@/lib/supabase/admin"
import { getSerpCacheTtlHours } from "@/lib/research/serp/config"
import type { SerpEngine, SerpProviderId } from "@/lib/research/serp/types"

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ")
}

export function serpCacheKey(engine: SerpEngine, query: string): string {
  const normalized = `${engine}:${normalizeQuery(query)}`
  return createHash("sha256").update(normalized).digest("hex")
}

type CachedRow = {
  response_json: unknown
  provider: SerpProviderId | null
  expires_at: string
}

export async function getCachedSerp<T>(
  engine: SerpEngine,
  query: string,
): Promise<{ response: T; provider: SerpProviderId | null } | null> {
  const admin = createAdminClient()
  if (!admin) return null

  const cacheKey = serpCacheKey(engine, query)
  const { data, error } = await admin
    .from("levelstack_serp_cache")
    .select("response_json, provider, expires_at")
    .eq("cache_key", cacheKey)
    .maybeSingle()

  if (error || !data) return null

  const row = data as CachedRow
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await admin.from("levelstack_serp_cache").delete().eq("cache_key", cacheKey)
    return null
  }

  return {
    response: row.response_json as T,
    provider: row.provider,
  }
}

export async function setCachedSerp(
  engine: SerpEngine,
  query: string,
  response: unknown,
  provider: SerpProviderId,
): Promise<void> {
  const admin = createAdminClient()
  if (!admin) return

  const ttlHours = getSerpCacheTtlHours()
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString()
  const cacheKey = serpCacheKey(engine, query)

  await admin.from("levelstack_serp_cache").upsert(
    {
      cache_key: cacheKey,
      engine,
      query: query.trim(),
      response_json: response,
      provider,
      expires_at: expiresAt,
    },
    { onConflict: "cache_key" },
  )
}

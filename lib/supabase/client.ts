import { createBrowserClient } from "@supabase/ssr"

import { env } from "@/env.mjs"

export function createClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createBrowserClient(url, key)
}

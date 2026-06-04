import { createClient } from "@supabase/supabase-js"

import { env } from "@/env.mjs"

/**
 * Service-role client for jobs and server-only writes. Never expose to the browser.
 */
export function createAdminClient() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

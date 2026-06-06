import type { SupabaseClient } from "@supabase/supabase-js"

import { getAppUrl } from "@/lib/urls"

/**
 * Records PDF delivery path after report is ready.
 * Full server-side PDF generation (Playwright/puppeteer) deferred — print view is canonical for v2 launch.
 */
export async function recordPdfDeliveryPath(
  reportId: string,
  admin: SupabaseClient,
): Promise<string> {
  const path = `/reports/${reportId}/print`
  await admin
    .from("levelstack_reports")
    .update({ pdf_storage_path: path })
    .eq("id", reportId)
  return getAppUrl(path)
}

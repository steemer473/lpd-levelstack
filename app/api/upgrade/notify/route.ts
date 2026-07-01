import { NextResponse } from "next/server"
import { z } from "zod"

import { env } from "@/env.mjs"
import { sendUpgradeNotifyEmailsIfNeeded } from "@/lib/email/upgrade-notify"
import { trackLevelstackPurchased } from "@/lib/plunk/track-event"
import { createAdminClient } from "@/lib/supabase/admin"

const bodySchema = z.object({
  reportId: z.string().uuid(),
  planId: z.string().min(1),
  email: z.string().email(),
})

export async function POST(request: Request) {
  const secret = env.LEVELSTACK_UPGRADE_NOTIFY_SECRET
  if (!secret) {
    return NextResponse.json(
      { success: false, message: "Upgrade notify is not configured." },
      { status: 503 },
    )
  }

  const authHeader = request.headers.get("authorization")
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  const headerSecret = request.headers.get("x-levelstack-upgrade-secret")
  if (bearer !== secret && headerSecret !== secret) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Invalid payload.", issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Server database client is not configured." },
      { status: 500 },
    )
  }

  const { data: report } = await admin
    .from("levelstack_reports")
    .select("id, user_id, intake_id")
    .eq("id", parsed.data.reportId)
    .maybeSingle()

  if (!report?.user_id) {
    return NextResponse.json({ success: false, message: "Report not found." }, { status: 404 })
  }

  const { data: userData } = await admin.auth.admin.getUserById(report.user_id)
  const userEmail = userData?.user?.email?.toLowerCase()
  if (userEmail && userEmail !== parsed.data.email.toLowerCase()) {
    return NextResponse.json(
      { success: false, message: "Email does not match report owner." },
      { status: 400 },
    )
  }

  const { data: intake } = await admin
    .from("levelstack_intakes")
    .select("form_data")
    .eq("id", report.intake_id)
    .maybeSingle()

  const formData = intake?.form_data as
    | { primaryBusinessName?: string; ownerName?: string }
    | null
  const businessName = formData?.primaryBusinessName ?? "your business"
  const ownerName = formData?.ownerName

  const sent = await sendUpgradeNotifyEmailsIfNeeded({
    reportId: parsed.data.reportId,
    userId: report.user_id,
    email: parsed.data.email,
    planId: parsed.data.planId,
    businessName,
    ownerName,
  })

  await trackLevelstackPurchased({
    email: parsed.data.email,
    reportId: parsed.data.reportId,
    planId: parsed.data.planId,
  }).catch((err) => console.error("[plunk] purchase track failed:", err))

  return NextResponse.json({ success: true, sent })
}

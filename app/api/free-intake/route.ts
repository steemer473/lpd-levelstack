import { after, NextResponse } from "next/server"

import { env } from "@/env.mjs"
import {
  freeSnapshotSchema,
  freeSnapshotToIntake,
} from "@/lib/intake/free-snapshot-schema"
import { isWebsiteReachable } from "@/lib/intake/validate-website"
import { planIdToReportTier } from "@/lib/levelstack-plans"
import { sendFreeSnapshotSignInEmail } from "@/lib/email/report-delivery"
import { syncFreeSnapshotLead } from "@/lib/ghl/sync-levelstack-lead"
import { runReportPipeline } from "@/lib/pipeline/run-report-pipeline"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUrl } from "@/lib/urls"

export const maxDuration = 300

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null)
  const parsed = freeSnapshotSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "Validation failed", issues: parsed.error.flatten() },
      { status: 400, headers: securityHeaders },
    )
  }

  const data = parsed.data

  const skipWebsiteCheck =
    process.env.NODE_ENV === "development" && env.LEVELSTACK_DEV_SKIP_WEBSITE_CHECK

  if (!skipWebsiteCheck) {
    const websiteCheck = await isWebsiteReachable(data.websiteUrl)
    if (!websiteCheck.ok) {
      return NextResponse.json(
        { success: false, message: websiteCheck.message },
        { status: 400, headers: securityHeaders },
      )
    }
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Server database client is not configured." },
      { status: 500, headers: securityHeaders },
    )
  }

  const email = data.email.trim().toLowerCase()
  let userId: string

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (created?.user) {
    userId = created.user.id
  } else {
    const { data: usersPage } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const existing = usersPage?.users?.find((u) => u.email?.toLowerCase() === email)
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: createError?.message ?? "Could not find or create account.",
        },
        { status: 500, headers: securityHeaders },
      )
    }
    userId = existing.id
  }

  const { data: priorIntake } = await admin
    .from("levelstack_intakes")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .maybeSingle()

  if (priorIntake) {
    const { data: existingReport } = await admin
      .from("levelstack_reports")
      .select("id")
      .eq("intake_id", priorIntake.id)
      .maybeSingle()

    return NextResponse.json(
      {
        success: false,
        message: "You have already submitted a LevelStack snapshot.",
        reportId: existingReport?.id ?? null,
      },
      { status: 409, headers: securityHeaders },
    )
  }

  await admin.from("levelstack_free_entitlements").upsert({
    user_id: userId,
    email,
    business_name: data.businessName.trim(),
  })

  const intakeData = freeSnapshotToIntake(data)
  const planId = "levelstack-free-snapshot"
  const reportTier = planIdToReportTier(planId)

  const { data: intake, error: intakeError } = await admin
    .from("levelstack_intakes")
    .insert({
      user_id: userId,
      status: "submitted",
      form_data: intakeData,
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (intakeError || !intake) {
    return NextResponse.json(
      { success: false, message: intakeError?.message ?? "Failed to save intake." },
      { status: 500, headers: securityHeaders },
    )
  }

  const { data: job, error: jobError } = await admin
    .from("levelstack_research_jobs")
    .insert({
      intake_id: intake.id,
      user_id: userId,
      status: "pending",
      metadata: { plan_id: planId, report_tier: reportTier },
    })
    .select("id")
    .single()

  if (jobError || !job) {
    return NextResponse.json(
      { success: false, message: jobError?.message ?? "Failed to queue job." },
      { status: 500, headers: securityHeaders },
    )
  }

  const { data: report, error: reportError } = await admin
    .from("levelstack_reports")
    .insert({
      intake_id: intake.id,
      user_id: userId,
      job_id: job.id,
      status: "pending",
      plan_id: planId,
      report_tier: reportTier,
    })
    .select("id")
    .single()

  if (reportError || !report) {
    return NextResponse.json(
      { success: false, message: reportError?.message ?? "Failed to create report." },
      { status: 500, headers: securityHeaders },
    )
  }

  after(() =>
    runReportPipeline({
      jobId: job.id,
      reportId: report.id,
      intakeId: intake.id,
    }).catch((err) => console.error("[pipeline]", err)),
  )

  after(() =>
    syncFreeSnapshotLead({
      email,
      businessName: data.businessName.trim(),
      websiteUrl: data.websiteUrl,
      marketCity: data.marketCity,
      reportId: report.id,
    }).catch((err) => console.error("[ghl]", err)),
  )

  const reportPath = `/reports/${report.id}`
  const callbackUrl = getAppUrl(
    `/auth/callback?next=${encodeURIComponent(reportPath)}`,
  )

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: callbackUrl },
  })

  const magicLink = linkData?.properties?.action_link ?? null
  let emailSent = false

  if (magicLink) {
    emailSent = await sendFreeSnapshotSignInEmail({
      to: email,
      businessName: data.businessName.trim(),
      signInUrl: magicLink,
    })
  } else if (linkError) {
    console.error("[free-intake] generateLink failed:", linkError.message)
  }

  const devFallback =
    process.env.NODE_ENV === "development" && !emailSent && Boolean(magicLink)

  return NextResponse.json({
    success: true,
    reportId: report.id,
    intakeId: intake.id,
    emailSent,
    magicLink: devFallback ? magicLink : undefined,
    message: emailSent
      ? "Check your email for a sign-in link. Your snapshot is generating now."
      : devFallback
        ? "Email is not configured — use the dev sign-in link below."
        : "Your snapshot is generating. Sign in with the same email to view your report.",
    redirectTo: getAppUrl(reportPath),
  })
}

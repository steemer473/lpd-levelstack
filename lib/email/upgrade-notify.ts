import { env } from "@/env.mjs"
import { buildReportResendSignInUrl, MAGIC_LINK_EXPIRY_LABEL } from "@/lib/auth/magic-link-callback"
import {
  emailCtaButton,
  emailCtaLink,
  emailLayout,
  getDefaultAdminNotifyEmail,
} from "@/lib/email/email-layout"
import { sendEmail } from "@/lib/email/send-email"
import { planDisplayName } from "@/lib/report/display-helpers"
import { getAppUrl } from "@/lib/urls"
import { createAdminClient } from "@/lib/supabase/admin"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function planPriceLabel(planId: string): string {
  if (planId === "levelstack-strategy-call" || planId === "levelstack-review-call") {
    return "$297"
  }
  return "$97"
}

function strategyCallNote(planId: string): string {
  if (planId === "levelstack-strategy-call" || planId === "levelstack-review-call") {
    return `<p style="margin:0 0 16px;font-size:14px;color:#64748b;">Your strategy call will be scheduled separately — we&apos;ll follow up after your report is ready.</p>`
  }
  return ""
}

export type UpgradeNotifyParams = {
  email: string
  businessName: string
  reportId: string
  planId: string
  signInUrl?: string
}

function buildPaymentReceivedBody(params: UpgradeNotifyParams): string {
  const intakeUrl = getAppUrl(`/intake?from=upgrade&reportId=${params.reportId}`)
  const signInUrl = params.signInUrl ?? intakeUrl
  const resendUrl = buildReportResendSignInUrl(params.reportId)
  const planLabel = planDisplayName(params.planId)
  const price = planPriceLabel(params.planId)
  const safeBusiness = escapeHtml(params.businessName)

  return `
    <p style="margin:0 0 16px;">Hi there,</p>
    <p style="margin:0 0 16px;">
      Payment received — thank you for upgrading to the <strong>${escapeHtml(planLabel)} (${price})</strong>
      for <strong>${safeBusiness}</strong>.
    </p>
    <p style="margin:0 0 16px;">
      Your full report unlocks <strong>6 diagnostic sections</strong>, a prioritized action plan,
      and a PDF export — once you complete a short intake (~3 minutes).
    </p>
    ${strategyCallNote(params.planId)}
    ${emailCtaButton(intakeUrl, "Complete your intake →")}
    <p style="margin:16px 0 8px;font-size:14px;color:#64748b;">
      Or copy this link into your browser:
    </p>
    <p style="margin:0 0 16px;font-size:13px;word-break:break-all;font-family:monospace;color:#334155;">
      ${escapeHtml(signInUrl)}
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;">
      This link is valid for ${MAGIC_LINK_EXPIRY_LABEL}.
      If it&apos;s expired, ${emailCtaLink(resendUrl, "request a new sign-in link")}.
    </p>
  `
}

function buildPaidUpgradeAdminBody(params: UpgradeNotifyParams): string {
  const reportUrl = getAppUrl(`/reports/${params.reportId}`)
  const intakeUrl = getAppUrl(`/intake?from=upgrade&reportId=${params.reportId}`)
  const planLabel = planDisplayName(params.planId)
  const price = planPriceLabel(params.planId)

  return `
    <p style="margin:0 0 16px;">Paid LevelStack upgrade received.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:15px;line-height:1.5;">
      <tr><td style="padding:8px 0;color:#64748b;width:140px;">Plan</td><td style="padding:8px 0;"><strong>${escapeHtml(planLabel)} (${price})</strong></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(params.email)}" style="color:#F97316;">${escapeHtml(params.email)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Business</td><td style="padding:8px 0;">${escapeHtml(params.businessName)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Report ID</td><td style="padding:8px 0;font-family:monospace;font-size:13px;">${escapeHtml(params.reportId)}</td></tr>
    </table>
    <p style="margin:24px 0 0;">
      ${emailCtaLink(reportUrl, "View report →")} · ${emailCtaLink(intakeUrl, "Intake link →")}
    </p>
  `
}

export async function sendPaymentReceivedEmail(params: UpgradeNotifyParams): Promise<void> {
  const body = buildPaymentReceivedBody(params)
  await sendEmail({
    to: params.email,
    subject: `You're in — finish your LevelStack intake for ${params.businessName}`,
    html: emailLayout({
      title: "Payment received",
      preheader: `Complete intake to generate your full report for ${params.businessName}.`,
      body,
    }),
  })
}

export async function sendPaidUpgradeAdminNotificationEmail(
  params: UpgradeNotifyParams,
): Promise<boolean> {
  const adminEmail = env.LEVELSTACK_ADMIN_NOTIFY_EMAIL ?? getDefaultAdminNotifyEmail()
  const price = planPriceLabel(params.planId)

  return sendEmail({
    to: adminEmail,
    subject: `Paid upgrade — ${params.businessName} (${price})`,
    html: emailLayout({
      title: "Paid upgrade",
      preheader: `${params.businessName} — ${params.email}`,
      body: buildPaidUpgradeAdminBody(params),
    }),
  })
}

/**
 * Send E1 + E5 once per report (dedupe via upgrade_notify_sent_at).
 */
export async function sendUpgradeNotifyEmailsIfNeeded(params: {
  reportId: string
  userId: string
  email: string
  planId: string
  businessName: string
}): Promise<boolean> {
  const admin = createAdminClient()
  if (!admin) return false

  const { data: row } = await admin
    .from("levelstack_reports")
    .select("upgrade_notify_sent_at")
    .eq("id", params.reportId)
    .eq("user_id", params.userId)
    .maybeSingle()

  if (row?.upgrade_notify_sent_at) return false

  await sendPaymentReceivedEmail({
    email: params.email,
    businessName: params.businessName,
    reportId: params.reportId,
    planId: params.planId,
  })

  await sendPaidUpgradeAdminNotificationEmail({
    email: params.email,
    businessName: params.businessName,
    reportId: params.reportId,
    planId: params.planId,
  })

  await admin
    .from("levelstack_reports")
    .update({ upgrade_notify_sent_at: new Date().toISOString() })
    .eq("id", params.reportId)
    .eq("user_id", params.userId)

  return true
}

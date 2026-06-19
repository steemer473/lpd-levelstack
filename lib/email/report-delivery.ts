import { env } from "@/env.mjs"
import { buildReportResendSignInUrl, MAGIC_LINK_EXPIRY_LABEL } from "@/lib/auth/magic-link-callback"
import {
  emailCtaButton,
  emailCtaLink,
  emailLayout,
  getDefaultAdminNotifyEmail,
} from "@/lib/email/email-layout"
import { sendEmail } from "@/lib/email/send-email"
import { getAppUrl, getHubPricingUrl, getHubSeoWaitlistUrl } from "@/lib/urls"
import type { ReportTier } from "@/lib/levelstack-plans"

type ReportReadyParams = {
  to: string
  businessName: string
  reportId: string
  reportTier: ReportTier
  topFinding?: string
  signInUrl?: string
  resendUrl?: string
  expirationLabel?: string
}

type NurtureParams = ReportReadyParams & {
  topFinding?: string
}

type FreeSnapshotAdminParams = {
  email: string
  businessName: string
  websiteUrl: string
  marketCity?: string
  reportId: string
  isNewAccount: boolean
}

function getAdminNotifyEmail(): string {
  return env.LEVELSTACK_ADMIN_NOTIFY_EMAIL ?? getDefaultAdminNotifyEmail()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildFreeSnapshotReadyBody(params: ReportReadyParams): string {
  const upgradeUrl = getHubPricingUrl()
  const signInUrl = params.signInUrl ?? getAppUrl(`/reports/${params.reportId}`)
  const resendUrl =
    params.resendUrl ?? buildReportResendSignInUrl(params.reportId)
  const expirationLabel = params.expirationLabel ?? MAGIC_LINK_EXPIRY_LABEL
  const safeBusiness = escapeHtml(params.businessName)

  const findingBlock = params.topFinding
    ? `<p style="margin:0 0 16px;"><strong>Key finding:</strong> ${escapeHtml(params.topFinding)}</p>`
    : `<p style="margin:0 0 16px;">Your audit covers 12 areas of your public presence.</p>`

  return `
    <p style="margin:0 0 16px;">Hi there,</p>
    <p style="margin:0 0 16px;">
      Your LevelStack snapshot for <strong>${safeBusiness}</strong> is ready.
    </p>
    ${findingBlock}
    <p style="margin:0 0 16px;">
      We found issues in your public presence. Your revenue funnel diagnosis,
      competitive position, and full prioritized action plan are in your
      ${emailCtaLink(upgradeUrl, "Full Report ($97)")}.
    </p>
    ${emailCtaButton(signInUrl, "Open your snapshot →")}
    <p style="margin:0 0 8px;font-size:14px;color:#64748b;">
      Or copy this link into your browser:
    </p>
    <p style="margin:0 0 16px;font-size:13px;word-break:break-all;font-family:monospace;color:#334155;">
      ${escapeHtml(signInUrl)}
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;">
      This link is valid for ${escapeHtml(expirationLabel)}.
      If it&apos;s expired, ${emailCtaLink(resendUrl, "request a new sign-in link")}.
    </p>
    <p style="margin:0;color:#64748b;font-size:13px;">
      If you did not request this, you can ignore this email.
    </p>
  `
}

export async function sendReportReadyEmail(params: ReportReadyParams): Promise<void> {
  const reportUrl = getAppUrl(`/reports/${params.reportId}`)
  const upgradeUrl = getHubPricingUrl()

  if (params.reportTier === "free_snapshot") {
    const body = buildFreeSnapshotReadyBody(params)

    await sendEmail({
      to: params.to,
      subject: `Your LevelStack snapshot for ${params.businessName} is ready`,
      html: emailLayout({
        title: "Your LevelStack snapshot is ready",
        preheader: "Your snapshot finished — pick up where you left off.",
        body,
      }),
    })
    return
  }

  const subject = `Your full LevelStack report for ${params.businessName} is ready`
  const layoutTitle = "Your full report is ready"

  const body = `
    <p style="margin:0 0 16px;">Hi,</p>
    <p style="margin:0 0 16px;">
      Your LevelStack report for <strong>${params.businessName}</strong> is ready.
    </p>
    ${
      params.topFinding
        ? `<p style="margin:0 0 16px;"><strong>Key finding:</strong> ${params.topFinding}</p>`
        : ""
    }
    <p style="margin:0 0 16px;">View your complete six-section report and prioritized action plan.</p>
    <p style="margin:0;">
      ${emailCtaLink(reportUrl, "Open your report →")}
    </p>
  `

  await sendEmail({
    to: params.to,
    subject,
    html: emailLayout({
      title: layoutTitle,
      preheader: `Your LevelStack report for ${params.businessName} is ready to view.`,
      body,
    }),
  })
}

export async function sendFreeSnapshotAdminNotificationEmail(
  params: FreeSnapshotAdminParams,
): Promise<boolean> {
  const reportUrl = getAppUrl(`/reports/${params.reportId}`)
  const userType = params.isNewAccount ? "New account" : "Returning user"
  const subjectSuffix = params.isNewAccount ? "" : " (returning)"
  const cityRow = params.marketCity?.trim()
    ? `<tr><td style="padding:8px 0;color:#64748b;">City</td><td style="padding:8px 0;">${escapeHtml(params.marketCity.trim())}</td></tr>`
    : ""

  const body = `
    <p style="margin:0 0 16px;">A free LevelStack snapshot was submitted.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:15px;line-height:1.5;">
      <tr><td style="padding:8px 0;color:#64748b;width:140px;">User type</td><td style="padding:8px 0;"><strong>${userType}</strong></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Email</td><td style="padding:8px 0;"><a href="mailto:${escapeHtml(params.email)}" style="color:#F97316;">${escapeHtml(params.email)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Business</td><td style="padding:8px 0;">${escapeHtml(params.businessName)}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;">Website</td><td style="padding:8px 0;"><a href="${escapeHtml(params.websiteUrl)}" style="color:#F97316;">${escapeHtml(params.websiteUrl)}</a></td></tr>
      ${cityRow}
    </table>
    <p style="margin:24px 0 0;">
      ${emailCtaLink(reportUrl, "View report (may still be generating) →")}
    </p>
  `

  return sendEmail({
    to: getAdminNotifyEmail(),
    subject: `New free snapshot — ${params.businessName}${subjectSuffix}`,
    html: emailLayout({
      title: "New free snapshot submission",
      preheader: `${params.businessName} — ${params.email}`,
      body,
    }),
  })
}

/** Nurture follow-ups (D1/D3/D7/D14) — reserved for GHL workflow or cron; not sent from the pipeline. */
export async function scheduleNurtureEmails(params: NurtureParams): Promise<void> {
  const seoUrl = getHubSeoWaitlistUrl()
  const upgradeUrl = getHubPricingUrl()

  if (params.reportTier !== "free_snapshot") {
    const body = `
      <p style="margin:0 0 16px;">
        Your full LevelStack report includes findings SEO Automator Pro is designed to monitor continuously.
      </p>
      <p style="margin:0;">
        ${emailCtaLink(seoUrl, "Explore SEO Automator Pro →")}
      </p>
    `

    await sendEmail({
      to: params.to,
      subject: `Next steps for ${params.businessName}'s search visibility`,
      html: emailLayout({
        title: "Next steps for your search visibility",
        preheader: `Explore SEO Automator Pro for ${params.businessName}.`,
        body,
      }),
    })
    return
  }

  const findingSubject = params.topFinding
    ? params.topFinding.slice(0, 60)
    : "Your public presence gaps"

  const body = `
    <p style="margin:0 0 16px;">
      Yesterday we delivered your free snapshot for <strong>${params.businessName}</strong>.
    </p>
    <p style="margin:0 0 16px;">
      Your full report includes revenue funnel diagnosis, competitive context, and a prioritized action plan.
    </p>
    <p style="margin:0;">
      ${emailCtaLink(upgradeUrl, "Upgrade to Full Report — $97 →")}
    </p>
  `

  await sendEmail({
    to: params.to,
    subject: `Re: ${findingSubject} — unlock your full LevelStack report`,
    html: emailLayout({
      title: "Unlock your full LevelStack report",
      preheader: `Upgrade to the full LevelStack report for ${params.businessName}.`,
      body,
    }),
  })
}

export async function sendNurtureDayEmail(
  day: 3 | 7 | 14,
  params: NurtureParams,
): Promise<void> {
  const seoUrl = getHubSeoWaitlistUrl()
  const upgradeUrl = getHubPricingUrl()

  const bodies: Record<number, string> = {
    3: `<p style="margin:0 0 16px;">LevelStack finds gaps once. SEO Automator Pro is designed to keep them closed — traditional SEO, local SEO, and AI search visibility.</p><p style="margin:0;">${emailCtaLink(seoUrl, "Join the waitlist →")}</p>`,
    7: `<p style="margin:0 0 16px;">Still thinking about your snapshot? The full report ranks every finding by cost to fix and revenue impact.</p><p style="margin:0;">${emailCtaLink(upgradeUrl, "Get the Full Report — $97 →")}</p>`,
    14: `<p style="margin:0 0 16px;">Your competitors aren't waiting. SEO Automator Pro monitors search visibility across your network continuously.</p><p style="margin:0;">${emailCtaLink(seoUrl, "Explore SEO Automator Pro →")}</p>`,
  }

  await sendEmail({
    to: params.to,
    subject: `LevelStack follow-up (day ${day}) — ${params.businessName}`,
    html: emailLayout({
      title: "LevelStack follow-up",
      preheader: `LevelStack follow-up for ${params.businessName}.`,
      body: bodies[day] ?? bodies[3] ?? "",
    }),
  })
}

import { sendEmail } from "@/lib/email/send-email"
import { getAppUrl, getHubPricingUrl, getHubSeoWaitlistUrl } from "@/lib/urls"
import type { ReportTier } from "@/lib/levelstack-plans"

type ReportReadyParams = {
  to: string
  businessName: string
  reportId: string
  reportTier: ReportTier
  topFinding?: string
}

type NurtureParams = ReportReadyParams & {
  topFinding?: string
}

type FreeSnapshotSignInParams = {
  to: string
  businessName: string
  signInUrl: string
}

/** Magic-link sign-in for /free snapshot — sent immediately after intake submit. */
export async function sendFreeSnapshotSignInEmail(
  params: FreeSnapshotSignInParams,
): Promise<boolean> {
  return sendEmail({
    to: params.to,
    subject: `Sign in to view your LevelStack snapshot — ${params.businessName}`,
    html: `
      <p>Hi,</p>
      <p>Your free LevelStack snapshot for <strong>${params.businessName}</strong> is generating now — usually under a minute.</p>
      <p>Click below to sign in and watch progress. This link expires after a short time.</p>
      <p><a href="${params.signInUrl}">Sign in and view your snapshot →</a></p>
      <p style="color:#666;font-size:13px">If you did not request this, you can ignore this email.</p>
    `,
  })
}

export async function sendReportReadyEmail(params: ReportReadyParams): Promise<void> {
  const reportUrl = getAppUrl(`/reports/${params.reportId}`)
  const upgradeUrl = getHubPricingUrl()

  const subject =
    params.reportTier === "free_snapshot"
      ? `Your LevelStack snapshot for ${params.businessName} is ready`
      : `Your full LevelStack report for ${params.businessName} is ready`

  const upgradeBlock =
    params.reportTier === "free_snapshot"
      ? `<p>We found issues in your public presence. Your revenue funnel diagnosis, competitive position, and full prioritized action plan are in your <a href="${upgradeUrl}">Full Report ($97)</a>.</p>`
      : `<p>View your complete six-section report and prioritized action plan.</p>`

  await sendEmail({
    to: params.to,
    subject,
    html: `
      <p>Hi,</p>
      <p>Your LevelStack report for <strong>${params.businessName}</strong> is ready.</p>
      ${params.topFinding ? `<p><strong>Key finding:</strong> ${params.topFinding}</p>` : ""}
      ${upgradeBlock}
      <p><a href="${reportUrl}">Open your report →</a></p>
    `,
  })
}

/** Schedules nurture sequence metadata — D1 upgrade (handled above), D3/D7/D14 logged for cron/workflow. */
export async function scheduleNurtureEmails(params: NurtureParams): Promise<void> {
  const seoUrl = getHubSeoWaitlistUrl()
  const upgradeUrl = getHubPricingUrl()

  if (params.reportTier !== "free_snapshot") {
    await sendEmail({
      to: params.to,
      subject: `Next steps for ${params.businessName}'s search visibility`,
      html: `
        <p>Your full LevelStack report includes findings SEO Automator Pro is designed to monitor continuously.</p>
        <p><a href="${seoUrl}">Explore SEO Automator Pro →</a></p>
      `,
    })
    return
  }

  const findingSubject = params.topFinding
    ? params.topFinding.slice(0, 60)
    : "Your public presence gaps"

  await sendEmail({
    to: params.to,
    subject: `Re: ${findingSubject} — unlock your full LevelStack report`,
    html: `
      <p>Yesterday we delivered your free snapshot for <strong>${params.businessName}</strong>.</p>
      <p>Your full report includes revenue funnel diagnosis, competitive context, and a prioritized action plan.</p>
      <p><a href="${upgradeUrl}">Upgrade to Full Report — $97 →</a></p>
    `,
  })
}

export async function sendNurtureDayEmail(
  day: 3 | 7 | 14,
  params: NurtureParams,
): Promise<void> {
  const seoUrl = getHubSeoWaitlistUrl()
  const upgradeUrl = getHubPricingUrl()

  const bodies: Record<number, string> = {
    3: `<p>LevelStack finds gaps once. SEO Automator Pro is designed to keep them closed — traditional SEO, local SEO, and AI search visibility.</p><p><a href="${seoUrl}">Join the waitlist →</a></p>`,
    7: `<p>Still thinking about your snapshot? The full report ranks every finding by cost to fix and revenue impact.</p><p><a href="${upgradeUrl}">Get the Full Report — $97 →</a></p>`,
    14: `<p>Your competitors aren't waiting. SEO Automator Pro monitors search visibility across your network continuously.</p><p><a href="${seoUrl}">Explore SEO Automator Pro →</a></p>`,
  }

  await sendEmail({
    to: params.to,
    subject: `LevelStack follow-up (day ${day}) — ${params.businessName}`,
    html: bodies[day] ?? bodies[3] ?? "",
  })
}

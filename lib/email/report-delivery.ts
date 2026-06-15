import { emailCtaLink, emailLayout } from "@/lib/email/email-layout"
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
  const body = `
    <p style="margin:0 0 16px;">Hi,</p>
    <p style="margin:0 0 16px;">
      Your free LevelStack snapshot for <strong>${params.businessName}</strong> is generating now — usually under a minute.
    </p>
    <p style="margin:0 0 16px;">
      Click below to sign in and watch progress. This link expires after a short time.
    </p>
    <p style="margin:0 0 16px;">
      ${emailCtaLink(params.signInUrl, "Sign in and view your snapshot →")}
    </p>
    <p style="margin:0;color:#64748b;font-size:13px;">
      If you did not request this, you can ignore this email.
    </p>
  `

  return sendEmail({
    to: params.to,
    subject: `Sign in to view your LevelStack snapshot — ${params.businessName}`,
    html: emailLayout({
      title: "Sign in to your LevelStack snapshot",
      preheader: `Your snapshot for ${params.businessName} is generating — sign in to watch progress.`,
      body,
    }),
  })
}

export async function sendReportReadyEmail(params: ReportReadyParams): Promise<void> {
  const reportUrl = getAppUrl(`/reports/${params.reportId}`)
  const upgradeUrl = getHubPricingUrl()

  const subject =
    params.reportTier === "free_snapshot"
      ? `Your LevelStack snapshot for ${params.businessName} is ready`
      : `Your full LevelStack report for ${params.businessName} is ready`

  const layoutTitle =
    params.reportTier === "free_snapshot"
      ? "Your LevelStack snapshot is ready"
      : "Your full report is ready"

  const upgradeBlock =
    params.reportTier === "free_snapshot"
      ? `<p style="margin:0 0 16px;">
          We found issues in your public presence. Your revenue funnel diagnosis, competitive position, and full prioritized action plan are in your
          ${emailCtaLink(upgradeUrl, "Full Report ($97)")}.
        </p>`
      : `<p style="margin:0 0 16px;">View your complete six-section report and prioritized action plan.</p>`

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
    ${upgradeBlock}
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

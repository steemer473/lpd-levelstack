/**
 * Branded HTML wrapper for LevelStack GHL nurture emails (Emails 2–5).
 * Assets hosted on levelplaydigital.com hub for long-term stability.
 */

const HUB_ORIGIN = "https://levelplaydigital.com"
const EMAIL_LOGO_URL = `${HUB_ORIGIN}/images/logo.png`
const EMAIL_HEADER_BG = "#000000"

export const GHL_EMAIL_ASSETS = {
  logo: EMAIL_LOGO_URL,
  gradientAccentBar: `${HUB_ORIGIN}/images/email/gradient-accent-bar.png`,
  ctaUnlock97: `${HUB_ORIGIN}/images/email/cta-unlock-97.png`,
  ctaSapWaitlist: `${HUB_ORIGIN}/images/email/cta-sap-waitlist.png`,
} as const

export const GHL_MERGE = {
  firstName: "{{ contact.first_name }}",
  reportUrl: "{{ contact.levelstack_report_url }}",
  topCompetitor: "{{ contact.top_competitor }}",
  topFinding: "{{ contact.top_finding }}",
  unsubscribe: "{{ unsubscribe_link }}",
} as const

export const GHL_LINKS = {
  upgradeHub: `${HUB_ORIGIN}/platform/levelstack?source=levelstack_email#pricing`,
  sapWaitlist: `${HUB_ORIGIN}/platform/seo`,
  privacy: `${HUB_ORIGIN}/privacy-policy`,
  terms: `${HUB_ORIGIN}/terms-of-service`,
} as const

const COMPANY = {
  name: "Level Play Digital",
  addressLine1: "3343 Peachtree Rd NE, Suite 145",
  addressLine2: "Atlanta, GA 30326",
  phone: "+1 (404) 574-1936",
  phoneHref: "tel:+14045741936",
  email: "admin@levelplaydigital.com",
} as const

const BRAND = {
  navy: "#002147",
  orange: "#FF6633",
  cyan: "#00BFFF",
  footerBg: "#f4f4f5",
  text: "#334155",
  muted: "#64748b",
  calloutBg: "#fff7f3",
  calloutBorder: "#ffd4c2",
  outerBg: "#eef2f7",
} as const

export type GhlEmailLayoutParams = {
  title: string
  preheader: string
  body: string
}

function buildHeader(): string {
  return `
    <tr>
      <td align="center" style="background-color:${EMAIL_HEADER_BG};padding:28px 32px 20px;">
        <img
          src="${GHL_EMAIL_ASSETS.logo}"
          alt="Level Play Digital"
          width="280"
          height="73"
          style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;max-width:280px;height:auto;"
        />
        <p style="margin:16px 0 0;font-family:Inter,Arial,sans-serif;font-size:22px;font-weight:700;line-height:1.2;color:#ffffff;letter-spacing:-0.02em;">
          LevelStack
        </p>
        <p style="margin:4px 0 0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.4;color:#94a3b8;">
          by Level Play Digital
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0;line-height:0;font-size:0;">
        <img
          src="${GHL_EMAIL_ASSETS.gradientAccentBar}"
          alt=""
          width="600"
          height="8"
          style="display:block;width:100%;max-width:600px;height:8px;border:0;"
        />
      </td>
    </tr>
  `
}

function buildFooter(): string {
  return `
    <tr>
      <td style="background-color:${BRAND.footerBg};padding:24px 32px;border-top:1px solid #e2e8f0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.6;color:${BRAND.text};">
              <p style="margin:0 0 8px;font-weight:600;color:${BRAND.navy};">${COMPANY.name}</p>
              <p style="margin:0 0 4px;">${COMPANY.addressLine1}</p>
              <p style="margin:0 0 12px;">${COMPANY.addressLine2}</p>
              <p style="margin:0 0 4px;">
                <a href="${COMPANY.phoneHref}" style="color:${BRAND.orange};text-decoration:none;">${COMPANY.phone}</a>
              </p>
              <p style="margin:0 0 16px;">
                <a href="mailto:${COMPANY.email}" style="color:${BRAND.orange};text-decoration:none;">${COMPANY.email}</a>
              </p>
              <p style="margin:0 0 12px;font-size:12px;">
                <a href="${GHL_LINKS.privacy}" style="color:${BRAND.muted};text-decoration:underline;">Privacy Policy</a>
                &nbsp;·&nbsp;
                <a href="${GHL_LINKS.terms}" style="color:${BRAND.muted};text-decoration:underline;">Terms of Service</a>
              </p>
              <p style="margin:0 0 8px;font-size:12px;color:${BRAND.muted};">
                © ${new Date().getFullYear()} ${COMPANY.name}. All rights reserved.
              </p>
              <p style="margin:0 0 8px;font-size:12px;color:${BRAND.muted};">
                You&apos;re receiving this because you requested a LevelStack snapshot.
              </p>
              <p style="margin:0;font-size:12px;color:${BRAND.muted};">
                <a href="${GHL_MERGE.unsubscribe}" style="color:${BRAND.muted};text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

/** Branded HTML wrapper for GHL nurture emails. */
export function ghlEmailLayout({ title, preheader, body }: GhlEmailLayoutParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.outerBg};font-family:Inter,Arial,sans-serif;color:${BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${preheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.outerBg};">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          ${buildHeader()}
          <tr>
            <td style="padding:32px;font-size:16px;line-height:1.6;color:${BRAND.text};">
              ${body}
            </td>
          </tr>
          ${buildFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function ghlParagraph(html: string): string {
  return `<p style="margin:0 0 16px;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.6;color:${BRAND.text};">${html}</p>`
}

export function ghlGreeting(): string {
  return ghlParagraph(`Hello, ${GHL_MERGE.firstName}`)
}

export function ghlLink(href: string, label: string): string {
  return `<a href="${href}" style="color:${BRAND.cyan};font-weight:600;text-decoration:underline;">${label}</a>`
}

export function ghlCallout(label: string, value: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
    <tr>
      <td style="background-color:${BRAND.calloutBg};border:1px solid ${BRAND.calloutBorder};border-radius:8px;padding:16px;">
        <p style="margin:0 0 6px;font-family:Inter,Arial,sans-serif;font-size:12px;font-weight:600;line-height:1.4;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.04em;">${label}</p>
        <p style="margin:0;font-family:Inter,Arial,sans-serif;font-size:18px;font-weight:600;line-height:1.4;color:${BRAND.navy};">${value}</p>
      </td>
    </tr>
  </table>`
}

export function ghlSignoff(): string {
  return ghlParagraph("— LevelStack Team")
}

/** Gradient CTA button — PNG fallback for broad email client support. */
export function ghlCtaButton(href: string, variant: "primary" | "secondary"): string {
  const asset =
    variant === "primary" ? GHL_EMAIL_ASSETS.ctaUnlock97 : GHL_EMAIL_ASSETS.ctaSapWaitlist
  const alt =
    variant === "primary" ? "Unlock Action Roadmap — $97" : "Join SEO Automator Pro Waitlist"

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">
    <tr>
      <td align="center">
        <a href="${href}" style="display:inline-block;text-decoration:none;border:0;">
          <img
            src="${asset}"
            alt="${alt}"
            width="280"
            height="52"
            style="display:block;border:0;outline:none;text-decoration:none;max-width:280px;height:auto;"
          />
        </a>
      </td>
    </tr>
  </table>`
}

export function buildEmail02Body(): string {
  return [
    ghlGreeting(),
    ghlParagraph("Before someone calls you, they search your name."),
    ghlParagraph(
      "They check reviews, compare options, and decide whether you look credible — often in under a minute.",
    ),
    ghlParagraph(
      "Your LevelStack snapshot shows what they see. The gaps are not always obvious from inside the business.",
    ),
    ghlParagraph("Open your snapshot:"),
    ghlParagraph(ghlLink(GHL_MERGE.reportUrl, GHL_MERGE.reportUrl)),
    ghlParagraph(
      "If you want the full diagnostic — competitive rankings, reputation depth, and prioritized actions — unlock Action Roadmap for $97.",
    ),
    ghlCtaButton(GHL_LINKS.upgradeHub, "primary"),
    ghlSignoff(),
  ].join("\n")
}

export function buildEmail03Body(): string {
  return [
    ghlGreeting(),
    ghlParagraph("One name keeps showing up when prospects compare options in your market:"),
    ghlCallout("Top competitor", GHL_MERGE.topCompetitor),
    ghlParagraph(
      "That gap is traffic going somewhere else. Every day it stays that way, someone who could have found you found them instead.",
    ),
    ghlParagraph(
      "Your Visibility Snapshot surfaces this pattern. Action Roadmap breaks down exactly where you stand and what to fix first.",
    ),
    ghlParagraph("Open your snapshot:"),
    ghlParagraph(ghlLink(GHL_MERGE.reportUrl, GHL_MERGE.reportUrl)),
    ghlCtaButton(GHL_LINKS.upgradeHub, "primary"),
    ghlSignoff(),
  ].join("\n")
}

export function buildEmail03FallbackBody(): string {
  return [
    ghlGreeting(),
    ghlParagraph(
      "A competitor in your market is capturing search visibility you could be earning.",
    ),
    ghlParagraph(
      "That gap is traffic going somewhere else. Every day it stays that way, someone who could have found you found them instead.",
    ),
    ghlParagraph(
      "Your Visibility Snapshot surfaces this pattern. Action Roadmap breaks down exactly where you stand and what to fix first.",
    ),
    ghlParagraph("Open your snapshot:"),
    ghlParagraph(ghlLink(GHL_MERGE.reportUrl, GHL_MERGE.reportUrl)),
    ghlCtaButton(GHL_LINKS.upgradeHub, "primary"),
    ghlSignoff(),
  ].join("\n")
}

export function buildEmail04Body(): string {
  return [
    ghlGreeting(),
    ghlParagraph(
      "A business owner opened their Visibility Snapshot and found something they had not thought about in years — an old partnership page, a former co-listing, or outdated credentials still ranking on page one.",
    ),
    ghlParagraph(
      "It was not malicious. It was just still indexed — and prospects do not know the backstory.",
    ),
    ghlParagraph(
      "&ldquo;I&rsquo;ll deal with it later&rdquo; is how small issues become expensive ones.",
    ),
    ghlParagraph("Your Visibility Snapshot already flagged what matters:"),
    ghlCallout("Top finding", GHL_MERGE.topFinding),
    ghlParagraph("See the full picture in your Action Roadmap dashboard:"),
    ghlParagraph(ghlLink(GHL_MERGE.reportUrl, GHL_MERGE.reportUrl)),
    ghlCtaButton(GHL_LINKS.upgradeHub, "primary"),
    ghlSignoff(),
  ].join("\n")
}

export function buildEmail05Body(): string {
  return [
    ghlGreeting(),
    ghlParagraph(
      "LevelStack gives you a Visibility Snapshot — what the internet shows about your business today.",
    ),
    ghlParagraph(
      "Search results change. Technical issues stack up quietly. The work in your action plan takes time; the technical layer does not have to stay manual.",
    ),
    ghlParagraph(
      "SEO Automator Pro monitors the technical foundation continuously so visibility does not slip between audits.",
    ),
    ghlCtaButton(GHL_LINKS.sapWaitlist, "secondary"),
    ghlParagraph(`Your snapshot (reference): ${ghlLink(GHL_MERGE.reportUrl, "Open Visibility Snapshot")}`),
    ghlSignoff(),
  ].join("\n")
}

export function buildWaitlistEmailW1Body(): string {
  return [
    ghlGreeting(),
    ghlParagraph("You're on the list, and your $97 assessment fee credit is locked in."),
    ghlParagraph(
      "When your SEO Automator Pro slot opens, we'll apply the full credit to your first month at charter pricing.",
    ),
    ghlParagraph(
      "Until then, keep working your highest-impact Action Roadmap items so automation starts from a cleaner baseline.",
    ),
    ghlCtaButton(GHL_LINKS.sapWaitlist, "secondary"),
    ghlSignoff(),
  ].join("\n")
}

export function buildWaitlistEmailW2Body(): string {
  return [
    ghlGreeting(),
    ghlParagraph('The anatomy of a "D" grade is usually one visibility leak, not one dramatic failure.'),
    ghlParagraph(
      "A missing local signal, stale metadata, or crawl drift can quietly reduce calls while everything looks normal on the surface.",
    ),
    ghlParagraph(
      "Your Action Roadmap prioritizes what to plug first. SEO Automator Pro is built to keep those gaps from reopening.",
    ),
    ghlCtaButton(GHL_LINKS.sapWaitlist, "secondary"),
    ghlSignoff(),
  ].join("\n")
}

export function buildWaitlistEmailW3Body(): string {
  return [
    ghlGreeting(),
    ghlParagraph("More operators are replacing one-off SEO retainers with monitored systems."),
    ghlParagraph(
      "The issue is not effort. It is drift: issues return between audits, and visibility leaks grow before anyone catches them.",
    ),
    ghlParagraph(
      "SEO Automator Pro is designed to monitor and correct the technical layer continuously while you execute your Action Roadmap.",
    ),
    ghlCtaButton(GHL_LINKS.sapWaitlist, "secondary"),
    ghlSignoff(),
  ].join("\n")
}

export function buildWaitlistEmailW4Body(): string {
  return [
    ghlGreeting(),
    ghlParagraph("Cohort update: we're preparing the next SEO Automator Pro automation slots."),
    ghlParagraph(
      "If your operations are still manual, now is the time to complete your highest-priority Action Roadmap items.",
    ),
    ghlParagraph(
      "That gives your account the fastest path from onboarding to stable search visibility once your slot is released.",
    ),
    ghlCtaButton(GHL_LINKS.sapWaitlist, "secondary"),
    ghlSignoff(),
  ].join("\n")
}

export const GHL_EMAIL_TEMPLATES = [
  {
    filename: "email-02-prospect.html",
    subject: "What your next prospect already found",
    preheader: "What prospects see before they call you",
    buildBody: buildEmail02Body,
  },
  {
    filename: "email-03-competitor.html",
    subject: "Who's ranking above you right now",
    preheader: "A competitor is capturing visibility you could be earning",
    buildBody: buildEmail03Body,
  },
  {
    filename: "email-03-competitor-fallback.html",
    subject: "Who's ranking above you right now",
    preheader: "Search visibility in your market is going somewhere else",
    buildBody: buildEmail03FallbackBody,
  },
  {
    filename: "email-04-finding.html",
    subject: "I didn't know it was there",
    preheader: "Something on page one you may not have thought about in years",
    buildBody: buildEmail04Body,
  },
  {
    filename: "email-05-sap-bridge.html",
    subject: "The part your Visibility Snapshot can't fix for you",
    preheader: "The technical layer does not have to stay manual",
    buildBody: buildEmail05Body,
  },
] as const

export const GHL_WAITLIST_EMAIL_TEMPLATES = [
  {
    filename: "waitlist-w1-credit-locked.html",
    subject: "You're on the list (and your $97 credit is locked in)",
    preheader: "Your SEO Automator Pro charter credit is secured.",
    buildBody: buildWaitlistEmailW1Body,
  },
  {
    filename: "waitlist-w2-grade-anatomy.html",
    subject: 'The anatomy of a "D" Grade (And the local search leak)',
    preheader: "Small visibility leaks create expensive local gaps.",
    buildBody: buildWaitlistEmailW2Body,
  },
  {
    filename: "waitlist-w3-ditch-traditional-agencies.html",
    subject: "Why local businesses are ditching traditional agencies",
    preheader: "Operators are moving from episodic SEO to monitored systems.",
    buildBody: buildWaitlistEmailW3Body,
  },
  {
    filename: "waitlist-w4-cohort-update.html",
    subject: "Cohort update: preparing the next automation slots",
    preheader: "What to finish now before onboarding opens.",
    buildBody: buildWaitlistEmailW4Body,
  },
] as const

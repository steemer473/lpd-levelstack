import { EMAIL_LOGO } from "./email-branding"

const COMPANY = {
  name: "Level Play Digital",
  addressLine1: "3343 Peachtree Rd NE, Suite 145",
  addressLine2: "Atlanta, GA 30326",
  phone: "+1 (404) 574-1936",
  phoneHref: "tel:+14045741936",
  email: "admin@levelplaydigital.com",
  privacyUrl: "https://levelplaydigital.com/privacy-policy",
  termsUrl: "https://levelplaydigital.com/terms-of-service",
} as const

const BRAND = {
  navy: "#002147",
  orange: "#F97316",
  footerBg: "#f4f4f5",
  text: "#334155",
  muted: "#64748b",
  emailHeaderBg: "#000000",
} as const

export type EmailLayoutParams = {
  title: string
  preheader?: string
  body: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildHeader(): string {
  return `
    <tr>
      <td align="center" style="background-color:${BRAND.emailHeaderBg};padding:28px 32px 24px;">
        <img
          src="${EMAIL_LOGO.url}"
          alt="${EMAIL_LOGO.alt}"
          width="${EMAIL_LOGO.width}"
          height="${EMAIL_LOGO.height}"
          style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;max-width:${EMAIL_LOGO.width}px;height:auto;"
        />
        <p style="margin:16px 0 0;font-family:Inter,Arial,sans-serif;font-size:22px;font-weight:700;line-height:1.2;color:#ffffff;letter-spacing:-0.02em;">
          LevelStack
        </p>
        <p style="margin:4px 0 0;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.4;color:#94a3b8;">
          by Level Play Digital
        </p>
      </td>
    </tr>
  `
}

function buildSignature(): string {
  return `
    <p style="margin:28px 0 0;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.6;color:${BRAND.text};">
      Sincerely,<br />
      <strong style="color:${BRAND.navy};">Level Play Digital Customer Success Team</strong>
    </p>
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
                <a href="${COMPANY.privacyUrl}" style="color:${BRAND.muted};text-decoration:underline;">Privacy Policy</a>
                &nbsp;·&nbsp;
                <a href="${COMPANY.termsUrl}" style="color:${BRAND.muted};text-decoration:underline;">Terms of Service</a>
              </p>
              <p style="margin:0 0 8px;font-size:12px;color:${BRAND.muted};">
                © ${new Date().getFullYear()} ${COMPANY.name}. All rights reserved.
              </p>
              <p style="margin:0;font-size:12px;color:${BRAND.muted};">
                You&apos;re receiving this email because you requested a LevelStack snapshot or report.
                This is a transactional email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

/** Branded HTML wrapper for LevelStack transactional emails. */
export function emailLayout({ title, preheader, body }: EmailLayoutParams): string {
  const safeTitle = escapeHtml(title)
  const safePreheader = preheader ? escapeHtml(preheader) : safeTitle

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${safeTitle}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:Inter,Arial,sans-serif;color:${BRAND.text};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${safePreheader}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          ${buildHeader()}
          <tr>
            <td style="padding:32px;font-size:16px;line-height:1.6;color:${BRAND.text};">
              ${body}
              ${buildSignature()}
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

/** Inline styles for primary CTA links in email body content. */
export function emailCtaLink(href: string, label: string): string {
  return `<a href="${href}" style="color:${BRAND.orange};font-weight:600;text-decoration:underline;">${escapeHtml(label)}</a>`
}

/** Primary button-styled CTA for transactional emails. */
export function emailCtaButton(href: string, label: string): string {
  const safeLabel = escapeHtml(label)
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td align="center" style="border-radius:6px;background-color:${BRAND.orange};">
        <a href="${href}" style="display:inline-block;padding:14px 28px;font-family:Inter,Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${safeLabel}</a>
      </td>
    </tr>
  </table>`
}

export function getDefaultAdminNotifyEmail(): string {
  return COMPANY.email
}

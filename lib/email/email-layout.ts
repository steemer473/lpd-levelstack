import { readFileSync } from "node:fs"
import { join } from "node:path"

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
} as const

export type EmailLayoutParams = {
  title: string
  preheader?: string
  body: string
}

let cachedLogoSvg: string | null = null

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function loadLogoSvg(): string {
  if (cachedLogoSvg) return cachedLogoSvg

  try {
    const svgPath = join(
      process.cwd(),
      "public/images/level-play-digital-logo-gradient-full.svg",
    )
    const raw = readFileSync(svgPath, "utf8")
    cachedLogoSvg = raw
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(
        /<svg[^>]*>/,
        '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="63" viewBox="0 0 3144.125562608647 821.2274557440728" role="img" aria-label="Level Play Digital">',
      )
    return cachedLogoSvg
  } catch {
    return `<span style="color:#ffffff;font-size:20px;font-weight:700;">Level Play Digital</span>`
  }
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
  const logoSvg = loadLogoSvg()

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
          <tr>
            <td align="center" style="background-color:${BRAND.navy};padding:28px 32px 20px;">
              <div style="max-width:240px;margin:0 auto;">
                ${logoSvg}
              </div>
              <p style="margin:12px 0 0;font-size:11px;font-weight:600;letter-spacing:0.12em;color:#94a3b8;text-transform:uppercase;">
                LEVELSTACK
              </p>
            </td>
          </tr>
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

/** Inline styles for primary CTA links in email body content. */
export function emailCtaLink(href: string, label: string): string {
  return `<a href="${href}" style="color:${BRAND.orange};font-weight:600;text-decoration:underline;">${label}</a>`
}

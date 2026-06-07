import { env } from "@/env.mjs"

export type SendEmailParams = {
  to: string
  subject: string
  html: string
}

/** Returns true when Resend accepted the message. */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    console.info("[email] Skipped (RESEND_API_KEY or FROM_EMAIL not set):", params.subject)
    return false
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.FROM_NAME
        ? `${env.FROM_NAME} <${env.FROM_EMAIL}>`
        : env.FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  })

  if (!res.ok) {
    console.error("[email] Send failed:", await res.text())
    return false
  }

  return true
}

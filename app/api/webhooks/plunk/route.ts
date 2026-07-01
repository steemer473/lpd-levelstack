import { createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

import { env } from "@/env.mjs"
import { PLUNK_EVENTS } from "@/lib/plunk/constants"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type PlunkWebhookPayload = {
  event?: string
  type?: string
  email?: string
  data?: Record<string, unknown>
  timestamp?: string
}

function verifyPlunkSignature(rawBody: string, signature: string | null): boolean {
  const secret = env.PLUNK_WEBHOOK_SECRET?.trim()
  if (!secret || !signature) return !secret
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex")
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return signature === expected
  }
}

function resolveEventType(payload: PlunkWebhookPayload): string {
  return String(payload.event || payload.type || "unknown")
}

function resolveEmail(payload: PlunkWebhookPayload): string | null {
  const direct = payload.email?.trim().toLowerCase()
  if (direct) return direct
  const nested = payload.data?.email
  if (typeof nested === "string" && nested.trim()) {
    return nested.trim().toLowerCase()
  }
  return null
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-plunk-signature")

  if (env.PLUNK_WEBHOOK_SECRET && !verifyPlunkSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: PlunkWebhookPayload
  try {
    payload = JSON.parse(rawBody) as PlunkWebhookPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const eventType = resolveEventType(payload)
  const email = resolveEmail(payload)

  const admin = createAdminClient()
  if (admin && email) {
    const metadata = payload.data ?? {}
    const campaignStep =
      typeof metadata.campaignStep === "string"
        ? metadata.campaignStep
        : typeof metadata.templateName === "string"
          ? metadata.templateName
          : null

    const { error } = await admin.from("email_events").insert({
      contact_email: email,
      event_type: eventType,
      campaign_step: campaignStep,
      plunk_event_id:
        typeof metadata.id === "string" ? metadata.id : typeof metadata.emailId === "string" ? metadata.emailId : null,
      metadata,
      occurred_at: payload.timestamp ?? new Date().toISOString(),
    })

    if (error) {
      console.error("[plunk-webhook] insert failed:", error.message)
    }

    if (eventType === PLUNK_EVENTS.unsubscribed || eventType === "contact.unsubscribed") {
      await plunkTrackUnsubscribeAck(email)
    }
  }

  return NextResponse.json({ received: true })
}

/** Reserved for future: cancel active workflow executions via Plunk API when unsubscribed. */
async function plunkTrackUnsubscribeAck(_email: string) {
  // Unsubscribe stops MARKETING sends in Plunk; no extra cancel call required for v1.
}

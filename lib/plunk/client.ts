import { env } from "@/env.mjs"

const DEFAULT_API_BASE = "https://next-api.useplunk.com"
const DEFAULT_WORKFLOW_API_BASE = "https://next-api.useplunk.com"

export type PlunkTrackParams = {
  email: string
  event: string
  subscribed?: boolean
  data?: Record<string, string | number | boolean | undefined | null>
}

export type PlunkApiResult<T = unknown> = {
  ok: boolean
  status: number
  data?: T
  error?: string
}

function getSecretKey(): string | undefined {
  return env.PLUNK_SECRET_KEY?.trim() || undefined
}

function apiBase(): string {
  const configured = env.PLUNK_API_URL?.trim() || DEFAULT_API_BASE
  if (configured.includes("api.useplunk.com") && !configured.includes("next-api.useplunk.com")) {
    return DEFAULT_API_BASE
  }
  return configured
}

export function workflowApiBase(): string {
  return env.PLUNK_WORKFLOW_API_URL?.trim() || DEFAULT_WORKFLOW_API_BASE
}

function authHeaders(): Record<string, string> {
  const key = getSecretKey()
  if (!key) {
    throw new Error("PLUNK_SECRET_KEY is not configured")
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  }
}

function normalizeData(
  data?: PlunkTrackParams["data"],
): Record<string, string | number | boolean> | undefined {
  if (!data) return undefined
  const out: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === "") continue
    out[key] = value
  }
  return Object.keys(out).length > 0 ? out : undefined
}

export function isPlunkConfigured(): boolean {
  return Boolean(getSecretKey())
}

/** Track a contact event — creates/updates contact and may trigger workflows. */
export async function plunkTrack(params: PlunkTrackParams): Promise<PlunkApiResult> {
  if (!isPlunkConfigured()) {
    console.info("[plunk] Skipped track (PLUNK_SECRET_KEY not set):", params.event, params.email)
    return { ok: false, status: 0, error: "not_configured" }
  }

  const body: Record<string, unknown> = {
    email: params.email.trim().toLowerCase(),
    event: params.event,
  }
  if (params.subscribed !== undefined) {
    body.subscribed = params.subscribed
  }
  const data = normalizeData(params.data)
  if (data) {
    body.data = data
  }

  try {
    const res = await fetch(`${apiBase()}/v1/track`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    })
    const text = await res.text()
    let parsed: unknown
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      parsed = text
    }
    if (!res.ok) {
      console.error("[plunk] track failed:", res.status, text.slice(0, 400))
      return {
        ok: false,
        status: res.status,
        error: typeof parsed === "object" && parsed && "error" in parsed
          ? String((parsed as { error: unknown }).error)
          : text.slice(0, 200),
      }
    }
    return { ok: true, status: res.status, data: parsed }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[plunk] track error:", message)
    return { ok: false, status: 0, error: message }
  }
}

export async function plunkApiRequest<T = unknown>(
  path: string,
  options: {
    method?: string
    body?: unknown
    workflowApi?: boolean
  } = {},
): Promise<PlunkApiResult<T>> {
  if (!isPlunkConfigured()) {
    return { ok: false, status: 0, error: "not_configured" }
  }

  const base = options.workflowApi ? workflowApiBase() : apiBase()
  const method = options.method ?? (options.body ? "POST" : "GET")

  try {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: authHeaders(),
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
    const text = await res.text()
    let parsed: T | undefined
    try {
      parsed = text ? (JSON.parse(text) as T) : undefined
    } catch {
      parsed = undefined
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: text.slice(0, 300),
        data: parsed,
      }
    }
    return { ok: true, status: res.status, data: parsed }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, status: 0, error: message }
  }
}

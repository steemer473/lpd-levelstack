import { env } from "@/env.mjs"

export interface GHLContactPayload {
  firstName: string
  lastName: string
  email: string
  phone?: string
  companyName?: string
  source?: string
  tags?: string[]
  customFields?: Record<string, string | string[] | number | boolean>
}

export interface GHLContactResponse {
  contact?: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  message?: string
  errors?: Array<{ message: string }>
}

type GHLContactSummary = {
  id: string
  email: string
  firstName: string
  lastName: string
}

function isConfigured(): boolean {
  return Boolean(env.GHL_API_KEY?.trim() && env.GHL_LOCATION_ID?.trim())
}

function getAuthHeaders(): Record<string, string> | null {
  if (!isConfigured()) return null

  const apiKey = env.GHL_API_KEY!.trim()
  const isPIT = apiKey.startsWith("pit-")
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Version: "2021-07-28",
    Authorization: `Bearer ${apiKey}`,
  }

  if (!isPIT) {
    headers.locationId = env.GHL_LOCATION_ID!.trim()
  }

  return headers
}

function getApiBase(isPIT: boolean): string {
  return isPIT
    ? "https://services.leadconnectorhq.com"
    : "https://rest.gohighlevel.com/v1"
}

function parseContactSearchResponse(responseText: string): GHLContactSummary | null {
  if (!responseText.trim()) return null

  const parsed = JSON.parse(responseText) as {
    contacts?: GHLContactSummary[]
    contact?: GHLContactSummary | null
  }

  if (parsed.contacts?.length) return parsed.contacts[0]!
  if (Array.isArray(parsed)) return (parsed as GHLContactSummary[])[0] ?? null
  if (parsed.contact) return parsed.contact

  return null
}

function buildContactSearchUrl(email: string, isPIT: boolean, base: string): string {
  const locationId = env.GHL_LOCATION_ID!.trim()
  const encodedEmail = encodeURIComponent(email)

  if (isPIT) {
    return `${base}/contacts/search/duplicate?locationId=${locationId}&email=${encodedEmail}`
  }

  return `${base}/contacts/search?email=${encodedEmail}`
}

function applyCustomFields(
  payload: Record<string, unknown>,
  customFields?: GHLContactPayload["customFields"],
): void {
  if (!customFields) return

  for (const [key, value] of Object.entries(customFields)) {
    if (value === undefined || value === null || value === "") continue
    payload[key] = Array.isArray(value) ? value.filter(Boolean).join(", ") : value
  }
}

function buildContactPayload(contactData: Partial<GHLContactPayload>): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    firstName: contactData.firstName || "",
    lastName: contactData.lastName || "",
    email: contactData.email || "",
  }

  if (contactData.phone?.trim()) payload.phone = contactData.phone.trim()
  if (contactData.companyName?.trim()) payload.companyName = contactData.companyName.trim()
  if (contactData.source) payload.source = contactData.source
  if (contactData.tags?.length) payload.tags = contactData.tags

  applyCustomFields(payload, contactData.customFields)
  return payload
}

function parseContactResponse(responseText: string): GHLContactResponse {
  if (!responseText.trim()) {
    return { message: "Empty response from GHL API" }
  }

  const parsed = JSON.parse(responseText) as GHLContactResponse & {
    id?: string
    email?: string
    statusCode?: number
    error?: string
  }

  if (parsed.statusCode || parsed.error) {
    return {
      errors: [{ message: parsed.error ?? parsed.message ?? "GHL API error" }],
    }
  }

  if (parsed.contact) return parsed
  if (parsed.id && parsed.email) {
    return {
      contact: {
        id: parsed.id,
        email: parsed.email,
        firstName: (parsed as { firstName?: string }).firstName ?? "",
        lastName: (parsed as { lastName?: string }).lastName ?? "",
      },
    }
  }

  return parsed
}

export async function searchGHLContactByEmail(
  email: string,
): Promise<GHLContactSummary | null> {
  const headers = getAuthHeaders()
  if (!headers) return null

  const apiKey = env.GHL_API_KEY!.trim()
  const isPIT = apiKey.startsWith("pit-")
  const base = getApiBase(isPIT)
  const searchUrl = buildContactSearchUrl(email, isPIT, base)

  try {
    const response = await fetch(searchUrl, { method: "GET", headers })
    const responseText = await response.text()

    if (!response.ok) {
      console.error("[ghl] search failed:", response.status, responseText.slice(0, 200))
      return null
    }

    return parseContactSearchResponse(responseText)
  } catch (error) {
    console.error("[ghl] search error:", error)
    return null
  }
}

export async function updateGHLContact(
  contactId: string,
  contactData: Partial<GHLContactPayload>,
): Promise<GHLContactResponse | null> {
  const headers = getAuthHeaders()
  if (!headers) return null

  const apiKey = env.GHL_API_KEY!.trim()
  const isPIT = apiKey.startsWith("pit-")
  const base = getApiBase(isPIT)
  const updateUrl = `${base}/contacts/${contactId}`
  const payload = buildContactPayload(contactData)

  try {
    let response = await fetch(updateUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    })

    if (response.status === 405) {
      response = await fetch(updateUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      })
    }

    const responseText = await response.text()
    const data = parseContactResponse(responseText)

    if (!response.ok) {
      console.error("[ghl] update failed:", response.status, data.errors ?? data.message)
    }

    return data
  } catch (error) {
    console.error("[ghl] update error:", error)
    return {
      errors: [{ message: error instanceof Error ? error.message : String(error) }],
    }
  }
}

export async function createGHLContact(
  contactData: GHLContactPayload,
): Promise<GHLContactResponse | null> {
  const existingContact = await searchGHLContactByEmail(contactData.email)
  if (existingContact) {
    return updateGHLContact(existingContact.id, contactData)
  }

  const headers = getAuthHeaders()
  if (!headers) {
    console.error("[ghl] GHL_API_KEY and/or GHL_LOCATION_ID not configured — skipping lead sync")
    return null
  }

  const apiKey = env.GHL_API_KEY!.trim()
  const isPIT = apiKey.startsWith("pit-")
  const base = getApiBase(isPIT)
  const apiUrl = `${base}/contacts/`
  const payload = buildContactPayload({
    ...contactData,
    source: contactData.source ?? "LevelStack",
    tags: contactData.tags ?? ["levelstack"],
  })

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    const data = parseContactResponse(responseText)

    if (!response.ok) {
      console.error("[ghl] create failed:", response.status, data.errors ?? data.message)
    }

    return data
  } catch (error) {
    console.error("[ghl] create error:", error)
    return {
      errors: [{ message: error instanceof Error ? error.message : String(error) }],
    }
  }
}

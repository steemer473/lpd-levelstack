/** Placeholder / empty service values that must not become a second search term. */
const PLACEHOLDER_SERVICES = new Set([
  "",
  "general business services",
  "not specified",
  "not provided",
])

function norm(value: string | null | undefined): string {
  return (value ?? "").trim()
}

function isDistinct(a: string, b: string): boolean {
  return a.length > 0 && b.length > 0 && a.toLowerCase() !== b.toLowerCase()
}

function isUsableService(service: string): boolean {
  return (
    service.length > 0 && !PLACEHOLDER_SERVICES.has(service.toLowerCase())
  )
}

export type IncognitoSearchInputs = {
  businessName?: string | null
  primaryService?: string | null
  categoryLabel?: string | null
  ownerName?: string | null
}

/**
 * Free DIY next-step copy for private/incognito brand search.
 * Never emits two identical quoted terms.
 */
export function buildIncognitoSearchNextStep(
  inputs: IncognitoSearchInputs,
): string {
  const businessName = norm(inputs.businessName) || "your business"
  const primaryService = norm(inputs.primaryService)
  const categoryLabel = norm(inputs.categoryLabel)
  const ownerName = norm(inputs.ownerName)

  let second: string | null = null

  if (isUsableService(primaryService)) {
    const combined = `${businessName} ${primaryService}`.trim()
    if (isDistinct(combined, businessName)) {
      second = combined
    }
  }

  if (!second && isDistinct(categoryLabel, businessName)) {
    const combined = `${businessName} ${categoryLabel}`.trim()
    if (isDistinct(combined, businessName)) {
      second = combined
    }
  }

  if (!second && isDistinct(ownerName, businessName)) {
    second = ownerName
  }

  if (second && isDistinct(second, businessName)) {
    return `Next step: Search in a private/incognito browser for "${businessName}" and "${second}" — no personal history.`
  }

  return `Next step: Search in a private/incognito browser for "${businessName}" — no personal history.`
}

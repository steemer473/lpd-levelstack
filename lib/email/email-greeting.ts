import { splitFullName } from "@/lib/ghl/split-name"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

export function firstNameFromOwnerName(ownerName: string): string {
  return splitFullName(ownerName).firstName
}

export function resolveRecipientFirstName(
  recipientFirstName?: string,
  ownerName?: string,
): string {
  const direct = recipientFirstName?.trim()
  if (direct) return direct
  if (ownerName?.trim()) return firstNameFromOwnerName(ownerName)
  return ""
}

export function formatEmailGreeting(firstName: string): string {
  const name = firstName.trim()
  return name ? `Hello, ${name}` : "Hello"
}

export function renderEmailGreetingHtml(firstName: string): string {
  const greeting = formatEmailGreeting(firstName)
  const safeGreeting = escapeHtml(greeting)

  return `<p style="margin:0 0 16px;font-family:Inter,Arial,sans-serif;font-size:16px;line-height:1.6;color:#334155;">${safeGreeting}</p>`
}

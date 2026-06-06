import { env } from "@/env.mjs"

export function getAppUrl(path = ""): string {
  const base = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return path ? new URL(path, base).toString() : base
}

export function getHubFreeSnapshotUrl(): string {
  const base = env.NEXT_PUBLIC_HUB_URL ?? "https://levelplaydigital.com"
  return new URL("/free", base).toString()
}

export function getHubPricingUrl(): string {
  const base = env.NEXT_PUBLIC_HUB_URL ?? "https://levelplaydigital.com"
  return new URL("/platform/levelstack#pricing", base).toString()
}

export function getHubSeoWaitlistUrl(): string {
  const base = env.NEXT_PUBLIC_HUB_URL ?? "https://levelplaydigital.com"
  return new URL("/platform/seo", base).toString()
}

export function getHubSignInUrl(redirectPath: string): string {
  const base = env.NEXT_PUBLIC_HUB_URL ?? "https://levelplaydigital.com"
  const url = new URL("/auth/sign-in", base)
  url.searchParams.set("redirect", getAppUrl(redirectPath))
  return url.toString()
}

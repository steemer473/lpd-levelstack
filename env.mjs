import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

const emptyToUndefined = (v) => (v === "" ? undefined : v)

const isVercel = process.env.VERCEL === "1"
const isVercelProduction = process.env.VERCEL_ENV === "production"

const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional())
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional())

const requiredInVercelProduction = (schema) =>
  isVercelProduction ? schema : optionalString

const requiredUrlInVercelProduction = (schema) =>
  isVercelProduction ? schema : optionalUrl

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    SUPABASE_SERVICE_ROLE_KEY: requiredInVercelProduction(z.string().min(1)),
    RESEND_API_KEY: optionalString,
    FROM_EMAIL: z.preprocess(emptyToUndefined, z.string().email().optional()),
    FROM_NAME: optionalString,
    /** Internal alert on free snapshot submit — defaults to admin@levelplaydigital.com in code */
    LEVELSTACK_ADMIN_NOTIFY_EMAIL: z.preprocess(
      emptyToUndefined,
      z.string().email().optional(),
    ),
    OPENAI_API_KEY: requiredInVercelProduction(z.string().min(1)),
    ANTHROPIC_API_KEY: optionalString,
    SERPAPI_KEY: optionalString,
    SEARCHAPI_KEY: optionalString,
    DATAFORSEO_LOGIN: optionalString,
    DATAFORSEO_PASSWORD: optionalString,
    /** Comma-separated provider order — default serpapi,searchapi,dataforseo */
    SERP_PROVIDER_CHAIN: optionalString,
    SERP_CACHE_TTL_HOURS: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().optional(),
    ),
    /** Development only — return fixture SERP data without API calls */
    LEVELSTACK_DEV_MOCK_SERP: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
    FIRECRAWL_API_KEY: optionalString,
    /** Optional — raises PageSpeed Insights API quota (works without key at low volume) */
    GOOGLE_PAGESPEED_API_KEY: optionalString,
    /** GoHighLevel — lead sync (same credentials as lpd-redesign) */
    GHL_API_KEY: optionalString,
    GHL_LOCATION_ID: optionalString,
    /** Development only — skip hub `orders` entitlement check for /intake */
    LEVELSTACK_DEV_BYPASS_ENTITLEMENT: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
    LEVELSTACK_DEV_SKIP_WEBSITE_CHECK: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
    /** Shared secret for hub → product POST /api/upgrade/notify */
    LEVELSTACK_UPGRADE_NOTIFY_SECRET: optionalString,
    /** Development only — replace prior free snapshot on re-submit (same email) */
    LEVELSTACK_DEV_REPLACE_SNAPSHOT: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: requiredUrlInVercelProduction(z.string().url()),
    NEXT_PUBLIC_HUB_URL: requiredUrlInVercelProduction(z.string().url()),
    NEXT_PUBLIC_SUPABASE_URL: requiredUrlInVercelProduction(z.string().url()),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredInVercelProduction(z.string().min(1)),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL,
    FROM_NAME: process.env.FROM_NAME,
    LEVELSTACK_ADMIN_NOTIFY_EMAIL: process.env.LEVELSTACK_ADMIN_NOTIFY_EMAIL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    SERPAPI_KEY: process.env.SERPAPI_KEY,
    SEARCHAPI_KEY: process.env.SEARCHAPI_KEY,
    DATAFORSEO_LOGIN: process.env.DATAFORSEO_LOGIN,
    DATAFORSEO_PASSWORD: process.env.DATAFORSEO_PASSWORD,
    SERP_PROVIDER_CHAIN: process.env.SERP_PROVIDER_CHAIN,
    SERP_CACHE_TTL_HOURS: process.env.SERP_CACHE_TTL_HOURS,
    LEVELSTACK_DEV_MOCK_SERP: process.env.LEVELSTACK_DEV_MOCK_SERP,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    GOOGLE_PAGESPEED_API_KEY: process.env.GOOGLE_PAGESPEED_API_KEY,
    GHL_API_KEY: process.env.GHL_API_KEY,
    GHL_LOCATION_ID: process.env.GHL_LOCATION_ID,
    LEVELSTACK_DEV_BYPASS_ENTITLEMENT: process.env.LEVELSTACK_DEV_BYPASS_ENTITLEMENT,
    LEVELSTACK_DEV_SKIP_WEBSITE_CHECK: process.env.LEVELSTACK_DEV_SKIP_WEBSITE_CHECK,
    LEVELSTACK_DEV_REPLACE_SNAPSHOT: process.env.LEVELSTACK_DEV_REPLACE_SNAPSHOT,
    LEVELSTACK_UPGRADE_NOTIFY_SECRET: process.env.LEVELSTACK_UPGRADE_NOTIFY_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_HUB_URL: process.env.NEXT_PUBLIC_HUB_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
})

if (isVercel && env.LEVELSTACK_DEV_BYPASS_ENTITLEMENT) {
  throw new Error(
    "LEVELSTACK_DEV_BYPASS_ENTITLEMENT must not be enabled on Vercel (production or preview).",
  )
}

if (isVercel && env.LEVELSTACK_DEV_SKIP_WEBSITE_CHECK) {
  throw new Error(
    "LEVELSTACK_DEV_SKIP_WEBSITE_CHECK must not be enabled on Vercel (production or preview).",
  )
}

if (isVercel && env.LEVELSTACK_DEV_REPLACE_SNAPSHOT) {
  throw new Error(
    "LEVELSTACK_DEV_REPLACE_SNAPSHOT must not be enabled on Vercel (production or preview).",
  )
}

if (isVercel && env.LEVELSTACK_DEV_MOCK_SERP) {
  throw new Error(
    "LEVELSTACK_DEV_MOCK_SERP must not be enabled on Vercel (production or preview).",
  )
}

if (isVercelProduction) {
  const hasSerpProvider =
    Boolean(env.SERPAPI_KEY) ||
    Boolean(env.SEARCHAPI_KEY) ||
    (Boolean(env.DATAFORSEO_LOGIN) && Boolean(env.DATAFORSEO_PASSWORD))

  if (!hasSerpProvider) {
    throw new Error(
      "At least one SERP provider must be configured in production (SERPAPI_KEY, SEARCHAPI_KEY, or DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD).",
    )
  }
}

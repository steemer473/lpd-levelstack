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
    OPENAI_API_KEY: requiredInVercelProduction(z.string().min(1)),
    ANTHROPIC_API_KEY: optionalString,
    SERPAPI_KEY: requiredInVercelProduction(z.string().min(1)),
    FIRECRAWL_API_KEY: optionalString,
    /** Optional — raises PageSpeed Insights API quota (works without key at low volume) */
    GOOGLE_PAGESPEED_API_KEY: optionalString,
    /** Development only — skip hub `orders` entitlement check for /intake */
    LEVELSTACK_DEV_BYPASS_ENTITLEMENT: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
    LEVELSTACK_DEV_SKIP_WEBSITE_CHECK: z
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
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    SERPAPI_KEY: process.env.SERPAPI_KEY,
    FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
    GOOGLE_PAGESPEED_API_KEY: process.env.GOOGLE_PAGESPEED_API_KEY,
    LEVELSTACK_DEV_BYPASS_ENTITLEMENT: process.env.LEVELSTACK_DEV_BYPASS_ENTITLEMENT,
    LEVELSTACK_DEV_SKIP_WEBSITE_CHECK: process.env.LEVELSTACK_DEV_SKIP_WEBSITE_CHECK,
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

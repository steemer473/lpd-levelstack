/**
 * Loads .env.local and smoke-tests configured SERP providers + OpenAI (no secrets printed).
 * Usage: node scripts/verify-research-keys.mjs
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const envPath = resolve(process.cwd(), ".env.local")
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const eq = trimmed.indexOf("=")
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  let value = trimmed.slice(eq + 1).trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }
  process.env[key] = value
}

const DEFAULT_CHAIN = ["serpapi", "searchapi", "dataforseo"]
const chainRaw = process.env.SERP_PROVIDER_CHAIN?.trim()
const chainOrder = chainRaw
  ? chainRaw.split(",").map((entry) => entry.trim().toLowerCase())
  : DEFAULT_CHAIN

const providerConfigured = {
  serpapi: Boolean(process.env.SERPAPI_KEY),
  searchapi: Boolean(process.env.SEARCHAPI_KEY),
  dataforseo: Boolean(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD),
}

const checks = {
  OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
  SERPAPI_KEY: providerConfigured.serpapi,
  SEARCHAPI_KEY: providerConfigured.searchapi,
  DATAFORSEO: providerConfigured.dataforseo,
  FIRECRAWL_API_KEY: Boolean(process.env.FIRECRAWL_API_KEY),
  GOOGLE_PAGESPEED_API_KEY: Boolean(process.env.GOOGLE_PAGESPEED_API_KEY),
  SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
}

console.log("Env loaded from .env.local:")
for (const [k, ok] of Object.entries(checks)) {
  console.log(`  ${k}: ${ok ? "ok" : "MISSING"}`)
}

const activeChain = chainOrder.filter((id) => providerConfigured[id])
console.log(`\nSERP provider chain: ${chainOrder.join(" → ")}`)
console.log(`Active (with keys): ${activeChain.length ? activeChain.join(" → ") : "none"}`)

let serpOk = false
const providerResults = {}

async function testSerpApi() {
  if (!process.env.SERPAPI_KEY) return false
  const params = new URLSearchParams({
    engine: "google",
    q: "level play digital",
    api_key: process.env.SERPAPI_KEY,
    num: "3",
  })
  const res = await fetch(`https://serpapi.com/search.json?${params}`)
  const data = await res.json()
  return res.ok && !data.error && (data.organic_results?.length ?? 0) > 0
}

async function testSearchApi() {
  if (!process.env.SEARCHAPI_KEY) return false
  const params = new URLSearchParams({
    engine: "google",
    q: "level play digital",
    api_key: process.env.SEARCHAPI_KEY,
    num: "3",
  })
  const res = await fetch(`https://www.searchapi.io/api/v1/search?${params}`)
  const data = await res.json()
  return res.ok && !data.error && (data.organic_results?.length ?? 0) > 0
}

async function testDataForSeo() {
  if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) return false
  const credentials = Buffer.from(
    `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`,
  ).toString("base64")
  const res = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        keyword: "level play digital",
        location_code: 2840,
        language_code: "en",
        depth: 3,
      },
    ]),
  })
  const data = await res.json()
  const items = data.tasks?.[0]?.result?.[0]?.items ?? []
  return res.ok && items.length > 0
}

if (providerConfigured.serpapi) {
  providerResults.serpapi = await testSerpApi()
  console.log(
    `SerpAPI: ${providerResults.serpapi ? "ok" : "failed — check key or quota"}`,
  )
  serpOk ||= providerResults.serpapi
}

if (providerConfigured.searchapi) {
  providerResults.searchapi = await testSearchApi()
  console.log(
    `SearchAPI: ${providerResults.searchapi ? "ok" : "failed — check key or quota"}`,
  )
  serpOk ||= providerResults.searchapi
}

if (providerConfigured.dataforseo) {
  providerResults.dataforseo = await testDataForSeo()
  console.log(
    `DataForSEO: ${providerResults.dataforseo ? "ok" : "failed — check credentials or quota"}`,
  )
  serpOk ||= providerResults.dataforseo
}

if (!Object.values(providerConfigured).some(Boolean)) {
  console.log("SERP: no provider keys configured")
}

let openaiOk = false

if (process.env.OPENAI_API_KEY) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 16,
      messages: [{ role: "user", content: 'Reply with JSON: {"ok":true}' }],
      response_format: { type: "json_object" },
    }),
  })
  const data = await res.json()
  openaiOk = res.ok && Boolean(data.choices?.[0]?.message?.content)
  console.log(
    `OpenAI: ${openaiOk ? "ok" : `failed — ${data.error?.message ?? res.status}`}`,
  )
}

let psiOk = null
{
  const psiParams = new URLSearchParams({
    url: "https://example.com",
    strategy: "mobile",
    category: "performance",
  })
  if (process.env.GOOGLE_PAGESPEED_API_KEY) {
    psiParams.set("key", process.env.GOOGLE_PAGESPEED_API_KEY)
  }
  try {
    const psiRes = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${psiParams}`,
      { signal: AbortSignal.timeout(60_000) },
    )
    const psiData = await psiRes.json()
    psiOk =
      psiRes.ok &&
      psiData.lighthouseResult?.categories?.performance?.score != null
    console.log(
      `PageSpeed: ${psiOk ? "ok" : `failed — ${psiData.error?.message ?? psiRes.status}`}${process.env.GOOGLE_PAGESPEED_API_KEY ? "" : " (no API key — optional)"}`,
    )
  } catch (e) {
    console.log(`PageSpeed: failed — ${e.message}`)
    psiOk = false
  }
}

const hasAnySerpProvider = Object.values(providerConfigured).some(Boolean)

if (!checks.OPENAI_API_KEY || !hasAnySerpProvider) {
  process.exit(1)
}
if (!serpOk || !openaiOk) {
  process.exit(2)
}
console.log("All required research keys verified.")

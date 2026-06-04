import { env } from "@/env.mjs"

export function isOpenAiConfigured(): boolean {
  return Boolean(env.OPENAI_API_KEY)
}

export async function completeOpenAiJson<T>(options: {
  system: string
  user: string
  maxTokens?: number
}): Promise<{ ok: true; json: T } | { ok: false; error: string }> {
  if (!env.OPENAI_API_KEY) {
    return { ok: false, error: "OPENAI_API_KEY is not configured." }
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: options.maxTokens ?? 6000,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: options.system },
          { role: "user", content: options.user },
        ],
      }),
      signal: AbortSignal.timeout(90_000),
    })

    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `OpenAI HTTP ${res.status}: ${text.slice(0, 200)}` }
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return { ok: false, error: "OpenAI returned empty content." }
    }

    const json = JSON.parse(content) as T
    return { ok: true, json }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "OpenAI request failed",
    }
  }
}

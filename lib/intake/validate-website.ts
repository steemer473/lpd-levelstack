export async function isWebsiteReachable(
  rawUrl: string,
  timeoutMs = 8000,
): Promise<{ ok: true } | { ok: false; message: string }> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return { ok: false, message: "Invalid website URL." }
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { ok: false, message: "Website must use http or https." }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url.toString(), {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    })

    if (response.status >= 200 && response.status < 400) {
      return { ok: true }
    }

    const getResponse = await fetch(url.toString(), {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
    })

    if (getResponse.status >= 200 && getResponse.status < 400) {
      return { ok: true }
    }

    return {
      ok: false,
      message: `Website returned status ${getResponse.status}. Check the URL is correct.`,
    }
  } catch {
    return {
      ok: false,
      message:
        "Could not reach that website. Confirm the URL is public and try again.",
    }
  } finally {
    clearTimeout(timer)
  }
}

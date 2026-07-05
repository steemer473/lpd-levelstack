import type { NextConfig } from "next"

import "./env.mjs"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  redirects: async () => [
    {
      source: "/levelstack-sample-report.html",
      destination: "/sample-report",
      permanent: true,
    },
  ],
}

export default nextConfig

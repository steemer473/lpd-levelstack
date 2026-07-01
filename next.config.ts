import type { NextConfig } from "next"

import "./env.mjs"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
}

export default nextConfig

import type { NextConfig } from "next"

import "./src/env"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
    ],
  },
}

export default nextConfig

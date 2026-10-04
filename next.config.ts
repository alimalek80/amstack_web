import type { NextConfig } from "next";

const apiOrigin = process.env.API_ORIGIN ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  // Self-contained server output, used by the Docker image later.
  output: "standalone",
  // In development the browser talks to Next.js only; /api and /media go to Django.
  // In production Caddy routes these paths before they ever reach Next.js.
  async rewrites() {
    return [
      // Next.js drops the trailing slash from the path, but Django URLs need it.
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*/` },
      { source: "/media/:path*", destination: `${apiOrigin}/media/:path*` },
    ];
  },
};

export default nextConfig;

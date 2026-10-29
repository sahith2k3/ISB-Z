import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Server action & server external packages for Postgres
  serverExternalPackages: ["pg"],
  async headers() {
    return [
      // 1. Static images across the site: 1 year immutable caching
      {
        source: "/:path*.(jpg|jpeg|png|webp|svg|ico|gif|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // 2. Seating images under /seating/
      {
        source: "/seating/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // 3. Dynamic seating image endpoint
      {
        source: "/api/seating/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // 4. Exact /seating page HTML route: fresh data navigation
      {
        source: "/seating",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      // 5. JSON API routes: dynamic
      {
        source: "/api/seating",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      // 6. Service worker script: never cached so updates take effect immediately
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/sg-planner",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

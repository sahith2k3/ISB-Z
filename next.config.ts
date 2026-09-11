import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Server action & server external packages for Postgres
  serverExternalPackages: ["pg"],
};

export default nextConfig;

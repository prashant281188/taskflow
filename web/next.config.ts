import type { NextConfig } from "next";

const backend = process.env.API_BACKEND_URL || "http://localhost:3000";
const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  async rewrites() {
    return [{ source: "/api/backend/:path*", destination: `${backend}/api/:path*` }];
  },
};
export default nextConfig;

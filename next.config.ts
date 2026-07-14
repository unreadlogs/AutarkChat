import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/docs": ["./docs/**/*"],
    "/docs/[...slug]": ["./docs/**/*"],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/reports/[id]/pdf": ["./src/fonts/**"],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/reports/[id]/pdf": ["./src/fonts/**"],
  },
  // pdfjs-dist's own Node.js detection breaks when bundled by Next.js/Turbopack
  // (it tries to spin up a browser-style worker and fails). Keep it external
  // so it runs unmodified under plain Node.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;

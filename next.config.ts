import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/reports/[id]/pdf": ["./src/fonts/**"],
    // pdfjs-dist reads its worker script and standard font/cmap data from
    // disk at runtime via dynamically-constructed paths, which Vercel's file
    // tracer can't follow statically — without these, PDF parsing throws in
    // production even though it works locally (all files are on disk there).
    "/api/reports/import-pdf": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      "./node_modules/pdfjs-dist/standard_fonts/**",
      "./node_modules/pdfjs-dist/cmaps/**",
    ],
  },
  // pdfjs-dist's own Node.js detection breaks when bundled by Next.js/Turbopack
  // (it tries to spin up a browser-style worker and fails). Keep it external
  // so it runs unmodified under plain Node.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;

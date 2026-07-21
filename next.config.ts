import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // フレームワーク/バージョンの露出を減らす。
  poweredByHeader: false,
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
  async headers() {
    // 'unsafe-inline' is kept for script/style because Next.js's own
    // hydration data and this app's many inline `style={{...}}` attributes
    // depend on it; removing it would require nonce-based middleware, which
    // is a larger follow-up. Even so, this blocks the common cases (loading
    // scripts/styles/frames from other origins, framing this app elsewhere).
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;

import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// CSP compatible with both the public site (next/image, self-hosted next/font,
// Google Maps embed) and the Payload admin (which needs eval + blob workers).
// 'unsafe-eval' is a known trade-off for the CMS admin; tighten with nonces later.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "frame-src 'self' https://www.google.com https://maps.google.com",
  `connect-src 'self'${isDev ? " ws: http://localhost:*" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
]
  .concat(isDev ? [] : ["upgrade-insecure-requests"])
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  // Cloudflare fronts this site and caches /_next/static/* as immutable. This id is
  // appended to every asset URL (?dpl=...), so a fresh build's assets are new URLs
  // that miss CF's cache instead of serving a stale/truncated cached chunk. It is a
  // literal (no env needed) so build and runtime always agree. BUMP this string on
  // any deploy where you must force Cloudflare to re-fetch cached assets.
  deploymentId: process.env.NEXT_DEPLOYMENT_ID || "d20260821-1",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "amicomotors.co.za" },
      { protocol: "https", hostname: "**.amicomotors.co.za" },
    ],
  },
  reactStrictMode: true,
  // TypeScript is the build-time quality gate; run ESLint separately via `npm run lint`.
  eslint: { ignoreDuringBuilds: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withPayload(nextConfig);

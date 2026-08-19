import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Components render vehicle imagery through next/image. Uploaded media is
  // served same-origin (no remote pattern needed); during seeding we may reference
  // the client's existing WordPress images, so allow that host too.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "amicomotors.co.za" },
      { protocol: "https", hostname: "**.amicomotors.co.za" },
    ],
  },
  reactStrictMode: true,
};

export default withPayload(nextConfig);

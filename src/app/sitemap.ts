import type { MetadataRoute } from "next";

import { getClient } from "@/lib/payload";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getClient();
  const [vehicles, posts, pages] = await Promise.all([
    payload.find({
      collection: "vehicles",
      where: { status: { not_equals: "sold" } },
      limit: 2000,
      depth: 0,
      pagination: false,
    }),
    payload.find({
      collection: "posts",
      where: { _status: { equals: "published" } },
      limit: 1000,
      depth: 0,
      pagination: false,
    }),
    payload.find({
      collection: "pages",
      where: { _status: { equals: "published" } },
      limit: 100,
      depth: 0,
      pagination: false,
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/vehicles`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/finance`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/sell-your-car`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.6 },
  ];

  const vehicleRoutes: MetadataRoute.Sitemap = vehicles.docs.map((v) => ({
    url: `${BASE}/vehicles/${v.slug}`,
    lastModified: v.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.docs.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const pageRoutes: MetadataRoute.Sitemap = pages.docs.map((pg) => ({
    url: `${BASE}/${pg.slug}`,
    lastModified: pg.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...vehicleRoutes, ...postRoutes, ...pageRoutes];
}

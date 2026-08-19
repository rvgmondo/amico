import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getPayload } from "payload";

import type { Media, Vehicle } from "@/payload-types";

/** Request-scoped Payload Local API client. */
export const getClient = cache(async () => getPayload({ config }));

/** Return a media URL relative to the app origin (so next/image treats it as local). */
export function mediaUrl(
  m?: Media | number | null,
  size?: "thumbnail" | "card" | "feature" | "og",
): string | null {
  if (!m || typeof m === "number") return null;
  const sized = size ? m.sizes?.[size]?.url : undefined;
  const url = sized || m.url;
  if (!url) return null;
  return url.replace(/^https?:\/\/[^/]+/, "");
}

export function primaryImage(v: Vehicle): Media | null {
  const first = v.images?.[0];
  return first && typeof first !== "number" ? first : null;
}

// --- Globals (cached across requests; revalidated by tag on change) ---

export const getSettings = cache(async () => {
  const payload = await getClient();
  return payload.findGlobal({ slug: "site-settings", depth: 1 });
});

export const getNavigation = cache(async () => {
  const payload = await getClient();
  return payload.findGlobal({ slug: "navigation", depth: 0 });
});

// --- Vehicles ---

export const getFeaturedVehicles = cache(async (limit = 8) => {
  const payload = await getClient();
  const res = await payload.find({
    collection: "vehicles",
    where: { and: [{ featured: { equals: true } }, { status: { not_equals: "sold" } }] },
    sort: "-createdAt",
    depth: 1,
    limit,
  });
  return res.docs;
});

export const getLatestVehicles = cache(async (limit = 8) => {
  const payload = await getClient();
  const res = await payload.find({
    collection: "vehicles",
    where: { status: { not_equals: "sold" } },
    sort: "-createdAt",
    depth: 1,
    limit,
  });
  return res.docs;
});

export const getVehicleBySlug = cache(async (slug: string) => {
  const payload = await getClient();
  const res = await payload.find({
    collection: "vehicles",
    where: { slug: { equals: slug } },
    depth: 2,
    limit: 1,
  });
  return res.docs[0] ?? null;
});

export const getRelatedVehicles = cache(async (vehicle: Vehicle, limit = 3) => {
  const payload = await getClient();
  const makeId = typeof vehicle.make === "number" ? vehicle.make : vehicle.make?.id;
  const res = await payload.find({
    collection: "vehicles",
    where: {
      and: [
        { id: { not_equals: vehicle.id } },
        { status: { not_equals: "sold" } },
        ...(makeId ? [{ make: { equals: makeId } }] : []),
      ],
    },
    depth: 1,
    limit,
  });
  if (res.docs.length >= limit) return res.docs;
  // Backfill with other available vehicles if not enough same-make.
  const more = await payload.find({
    collection: "vehicles",
    where: { and: [{ id: { not_equals: vehicle.id } }, { status: { not_equals: "sold" } }] },
    depth: 1,
    limit,
  });
  const seen = new Set(res.docs.map((d) => d.id));
  return [...res.docs, ...more.docs.filter((d) => !seen.has(d.id))].slice(0, limit);
});

export const getTestimonials = cache(async (limit = 12) => {
  const payload = await getClient();
  const res = await payload.find({
    collection: "testimonials",
    sort: "-featured",
    limit,
  });
  return res.docs;
});

/** All makes with their available-vehicle counts, for filter facets. */
export const getMakeFacets = unstable_cache(
  async () => {
    const payload = await getClient();
    const makes = await payload.find({ collection: "makes", limit: 100, sort: "name" });
    const counts = await Promise.all(
      makes.docs.map(async (m) => {
        const res = await payload.count({
          collection: "vehicles",
          where: { and: [{ make: { equals: m.id } }, { status: { not_equals: "sold" } }] },
        });
        return { id: m.id, name: m.name, slug: m.slug ?? String(m.id), count: res.totalDocs };
      }),
    );
    return counts.filter((c) => c.count > 0);
  },
  ["make-facets"],
  { revalidate: 300 },
);

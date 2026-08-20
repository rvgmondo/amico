import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { getPayload } from "payload";

import type { FacetRow } from "@/lib/vehicle-query";
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

/** Lightweight facet source: all available vehicles' filterable fields. */
export const getFacetSource = unstable_cache(
  async (): Promise<FacetRow[]> => {
    const payload = await getClient();
    const res = await payload.find({
      collection: "vehicles",
      where: { status: { not_equals: "sold" } },
      depth: 1,
      limit: 1000,
      pagination: false,
    });
    return res.docs.map((v) => {
      const make = typeof v.make === "object" && v.make ? v.make : null;
      return {
        makeSlug: make?.slug ?? String(make?.id ?? ""),
        makeName: make?.name ?? "Other",
        body: v.bodyType ?? null,
        fuel: v.fuelType ?? null,
        transmission: v.transmission ?? null,
        price: v.price ?? null,
        year: v.year ?? null,
      };
    });
  },
  ["facet-source"],
  { revalidate: 120 },
);

export const getMakeBySlug = cache(async (slug: string) => {
  if (!slug) return null;
  const payload = await getClient();
  const res = await payload.find({ collection: "makes", where: { slug: { equals: slug } }, limit: 1 });
  return res.docs[0] ?? null;
});

// --- Pages, posts, team ---

export const getPageBySlug = cache(async (slug: string) => {
  const payload = await getClient();
  const res = await payload.find({
    collection: "pages",
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }] },
    depth: 1,
    limit: 1,
  });
  return res.docs[0] ?? null;
});

export async function getPublishedPageSlugs(): Promise<string[]> {
  const payload = await getClient();
  const res = await payload.find({
    collection: "pages",
    where: { _status: { equals: "published" } },
    limit: 100,
    depth: 0,
  });
  return res.docs.map((d) => d.slug).filter((s): s is string => Boolean(s));
}

export const getTeam = cache(async () => {
  const payload = await getClient();
  const res = await payload.find({ collection: "team", sort: "order", limit: 50, depth: 1 });
  return res.docs;
});

export const getPosts = cache(async (limit = 12) => {
  const payload = await getClient();
  const res = await payload.find({
    collection: "posts",
    where: { _status: { equals: "published" } },
    sort: "-publishedDate",
    depth: 1,
    limit,
  });
  return res.docs;
});

export const getPostBySlug = cache(async (slug: string) => {
  const payload = await getClient();
  const res = await payload.find({
    collection: "posts",
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }] },
    depth: 1,
    limit: 1,
  });
  return res.docs[0] ?? null;
});

export async function getPublishedPostSlugs(): Promise<string[]> {
  const payload = await getClient();
  const res = await payload.find({
    collection: "posts",
    where: { _status: { equals: "published" } },
    limit: 200,
    depth: 0,
  });
  return res.docs.map((d) => d.slug).filter((s): s is string => Boolean(s));
}

export const getVehiclesByIds = async (ids: number[]) => {
  if (!ids.length) return [];
  const payload = await getClient();
  const res = await payload.find({
    collection: "vehicles",
    where: { id: { in: ids } },
    depth: 1,
    limit: ids.length,
  });
  return res.docs;
};

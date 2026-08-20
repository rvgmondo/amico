import type { Where } from "payload";

import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/vehicle-options";

export type VehicleFilters = {
  make: string; // make slug
  body: string[];
  fuel: string[];
  transmission: string[];
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  q: string;
  sort: string;
  page: number;
};

export type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

const list = (v: string | string[] | undefined): string[] => {
  const s = first(v);
  return s ? s.split(",").map((x) => x.trim()).filter(Boolean) : [];
};

const int = (v: string | string[] | undefined): number | undefined => {
  const s = first(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "year-desc", label: "Year: newest" },
  { value: "mileage-asc", label: "Mileage: lowest" },
];

const SORT_MAP: Record<string, string> = {
  newest: "-createdAt",
  "price-asc": "price",
  "price-desc": "-price",
  "year-desc": "-year",
  "mileage-asc": "mileage",
};

export const PAGE_SIZE = 12;

export function parseVehicleFilters(sp: SearchParams): VehicleFilters {
  return {
    make: first(sp.make) ?? "",
    body: list(sp.body),
    fuel: list(sp.fuel),
    transmission: list(sp.transmission),
    minPrice: int(sp.minPrice),
    maxPrice: int(sp.maxPrice),
    minYear: int(sp.minYear),
    maxYear: int(sp.maxYear),
    q: first(sp.q) ?? "",
    sort: first(sp.sort) ?? "newest",
    page: Math.max(1, int(sp.page) ?? 1),
  };
}

/** Build a Payload `where` from filters. `makeId` maps the make slug to its id. */
export function buildWhere(filters: VehicleFilters, makeId?: number | string | null): Where {
  const and: Where[] = [{ status: { not_equals: "sold" } }];
  if (filters.make && makeId != null) and.push({ make: { equals: makeId } });
  if (filters.body.length) and.push({ bodyType: { in: filters.body } });
  if (filters.fuel.length) and.push({ fuelType: { in: filters.fuel } });
  if (filters.transmission.length) and.push({ transmission: { in: filters.transmission } });
  if (filters.minPrice != null) and.push({ price: { greater_than_equal: filters.minPrice } });
  if (filters.maxPrice != null) and.push({ price: { less_than_equal: filters.maxPrice } });
  if (filters.minYear != null) and.push({ year: { greater_than_equal: filters.minYear } });
  if (filters.maxYear != null) and.push({ year: { less_than_equal: filters.maxYear } });
  if (filters.q) and.push({ title: { like: filters.q } });
  return { and };
}

export const sortFor = (sort: string): string => SORT_MAP[sort] ?? "-createdAt";

/** Serialize filters back to a URLSearchParams string (omitting defaults/empties). */
export function filtersToQuery(filters: Partial<VehicleFilters>): string {
  const p = new URLSearchParams();
  if (filters.make) p.set("make", filters.make);
  if (filters.body?.length) p.set("body", filters.body.join(","));
  if (filters.fuel?.length) p.set("fuel", filters.fuel.join(","));
  if (filters.transmission?.length) p.set("transmission", filters.transmission.join(","));
  if (filters.minPrice != null) p.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) p.set("maxPrice", String(filters.maxPrice));
  if (filters.minYear != null) p.set("minYear", String(filters.minYear));
  if (filters.maxYear != null) p.set("maxYear", String(filters.maxYear));
  if (filters.q) p.set("q", filters.q);
  if (filters.sort && filters.sort !== "newest") p.set("sort", filters.sort);
  if (filters.page && filters.page > 1) p.set("page", String(filters.page));
  return p.toString();
}

// --- In-memory faceting over the lightweight source (all available vehicles) ---

export type FacetRow = {
  makeSlug: string;
  makeName: string;
  body?: string | null;
  fuel?: string | null;
  transmission?: string | null;
  price?: number | null;
  year?: number | null;
};

const rowMatches = (row: FacetRow, f: VehicleFilters, ignore: keyof VehicleFilters): boolean => {
  if (ignore !== "make" && f.make && row.makeSlug !== f.make) return false;
  if (ignore !== "body" && f.body.length && !(row.body && f.body.includes(row.body))) return false;
  if (ignore !== "fuel" && f.fuel.length && !(row.fuel && f.fuel.includes(row.fuel))) return false;
  if (
    ignore !== "transmission" &&
    f.transmission.length &&
    !(row.transmission && f.transmission.includes(row.transmission))
  )
    return false;
  if (ignore !== "minPrice" && f.minPrice != null && (row.price ?? 0) < f.minPrice) return false;
  if (ignore !== "maxPrice" && f.maxPrice != null && (row.price ?? 0) > f.maxPrice) return false;
  if (ignore !== "minYear" && f.minYear != null && (row.year ?? 0) < f.minYear) return false;
  if (ignore !== "maxYear" && f.maxYear != null && (row.year ?? 0) > f.maxYear) return false;
  return true;
};

const countBy = (
  rows: FacetRow[],
  f: VehicleFilters,
  dim: keyof VehicleFilters,
  pick: (r: FacetRow) => string | null | undefined,
) => {
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (!rowMatches(r, f, dim)) continue;
    const key = pick(r);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};

export function computeFacets(rows: FacetRow[], f: VehicleFilters) {
  const makeCounts = countBy(rows, f, "make", (r) => r.makeSlug);
  const makeNames = new Map(rows.map((r) => [r.makeSlug, r.makeName]));
  const makes = [...makeCounts.entries()]
    .map(([slug, count]) => ({ slug, name: makeNames.get(slug) ?? slug, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const bodyCounts = countBy(rows, f, "body", (r) => r.body ?? undefined);
  const bodies = BODY_TYPES.map((o) => ({ ...o, count: bodyCounts.get(o.value) ?? 0 })).filter(
    (o) => o.count > 0,
  );

  const fuelCounts = countBy(rows, f, "fuel", (r) => r.fuel ?? undefined);
  const fuels = FUEL_TYPES.map((o) => ({ ...o, count: fuelCounts.get(o.value) ?? 0 })).filter(
    (o) => o.count > 0,
  );

  const transCounts = countBy(rows, f, "transmission", (r) => r.transmission ?? undefined);
  const transmissions = TRANSMISSIONS.map((o) => ({
    ...o,
    count: transCounts.get(o.value) ?? 0,
  })).filter((o) => o.count > 0);

  const prices = rows.map((r) => r.price ?? 0).filter(Boolean);
  const years = rows.map((r) => r.year ?? 0).filter(Boolean);

  return {
    makes,
    bodies,
    fuels,
    transmissions,
    priceMin: prices.length ? Math.min(...prices) : 0,
    priceMax: prices.length ? Math.max(...prices) : 1000000,
    yearMin: years.length ? Math.min(...years) : 2000,
    yearMax: years.length ? Math.max(...years) : new Date().getFullYear(),
    total: rows.length,
  };
}

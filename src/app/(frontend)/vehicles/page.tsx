import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { FilterSheet } from "@/components/vehicles/filter-sheet";
import { FiltersPanel } from "@/components/vehicles/filters-panel";
import { Pagination } from "@/components/vehicles/pagination";
import { SortSelect } from "@/components/vehicles/sort-select";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { getClient, getFacetSource, getMakeBySlug } from "@/lib/payload";
import {
  buildWhere,
  computeFacets,
  filtersToQuery,
  PAGE_SIZE,
  parseVehicleFilters,
  type SearchParams,
  sortFor,
} from "@/lib/vehicle-query";
import { BODY_TYPES, FUEL_TYPES, labelFor, TRANSMISSIONS } from "@/lib/vehicle-options";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const filters = parseVehicleFilters(await searchParams);
  const make = filters.make ? await getMakeBySlug(filters.make) : null;
  const title = make ? `${make.name} for sale in Pretoria` : "Used cars for sale in Pretoria";
  return {
    title,
    description:
      "Browse Amico Motors' full selection of quality used vehicles in Gezina, Pretoria. Filter by make, body type, price, year, fuel and transmission.",
    alternates: { canonical: "/vehicles" },
  };
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseVehicleFilters(await searchParams);
  const [source, make] = await Promise.all([
    getFacetSource(),
    filters.make ? getMakeBySlug(filters.make) : Promise.resolve(null),
  ]);
  const facets = computeFacets(source, filters);

  const payload = await getClient();
  const res = await payload.find({
    collection: "vehicles",
    where: buildWhere(filters, make?.id ?? null),
    sort: sortFor(filters.sort),
    depth: 1,
    limit: PAGE_SIZE,
    page: filters.page,
  });

  const activeCount =
    (filters.make ? 1 : 0) +
    filters.body.length +
    filters.fuel.length +
    filters.transmission.length +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.minYear != null ? 1 : 0) +
    (filters.maxYear != null ? 1 : 0) +
    (filters.q ? 1 : 0);

  const chips = buildChips(filters, make?.name);

  return (
    <>
      <section className="border-b border-border bg-subtle">
        <Container className="py-10">
          <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-accent-ink">
            Our vehicles
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {make ? `${make.name} for sale` : "Quality used cars"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {res.totalDocs} {res.totalDocs === 1 ? "vehicle" : "vehicles"} available
          </p>
        </Container>
      </section>

      <Container className="grid gap-8 py-10 lg:grid-cols-[280px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
            <FiltersPanel facets={facets} filters={filters} />
          </div>
        </aside>

        <div className="flex flex-col gap-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FilterSheet
                facets={facets}
                filters={filters}
                activeCount={activeCount}
                total={res.totalDocs}
              />
              <span className="text-sm text-muted-foreground">
                Showing {res.docs.length} of {res.totalDocs}
              </span>
            </div>
            <SortSelect filters={filters} />
          </div>

          {/* Active filter chips */}
          {chips.length ? (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <Link
                  key={chip.key}
                  href={`/vehicles?${chip.query}`}
                  scroll={false}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-muted"
                >
                  {chip.label} <span aria-hidden>×</span>
                </Link>
              ))}
            </div>
          ) : null}

          {/* Results */}
          {res.docs.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {res.docs.map((v, i) => (
                <VehicleCard key={v.id} vehicle={v} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
              <p className="font-display text-lg font-bold">No vehicles match your filters</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Try widening your search, or clear the filters to see everything in stock.
              </p>
              <Link
                href="/vehicles"
                className="mt-2 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                Clear filters
              </Link>
            </div>
          )}

          <Pagination filters={filters} totalPages={res.totalPages} />
        </div>
      </Container>
    </>
  );
}

/** Removable active-filter chips: each links to the filter set minus that value. */
function buildChips(filters: ReturnType<typeof parseVehicleFilters>, makeName?: string) {
  const chips: { key: string; label: string; query: string }[] = [];
  const without = (patch: Partial<typeof filters>) =>
    filtersToQuery({ ...filters, ...patch, page: 1 });

  if (filters.make && makeName)
    chips.push({ key: "make", label: makeName, query: without({ make: "" }) });
  for (const b of filters.body)
    chips.push({
      key: `body-${b}`,
      label: labelFor(BODY_TYPES, b),
      query: without({ body: filters.body.filter((x) => x !== b) }),
    });
  for (const f of filters.fuel)
    chips.push({
      key: `fuel-${f}`,
      label: labelFor(FUEL_TYPES, f),
      query: without({ fuel: filters.fuel.filter((x) => x !== f) }),
    });
  for (const t of filters.transmission)
    chips.push({
      key: `trans-${t}`,
      label: labelFor(TRANSMISSIONS, t),
      query: without({ transmission: filters.transmission.filter((x) => x !== t) }),
    });
  if (filters.minPrice != null)
    chips.push({ key: "minPrice", label: `Min R${filters.minPrice}`, query: without({ minPrice: undefined }) });
  if (filters.maxPrice != null)
    chips.push({ key: "maxPrice", label: `Max R${filters.maxPrice}`, query: without({ maxPrice: undefined }) });
  if (filters.minYear != null)
    chips.push({ key: "minYear", label: `From ${filters.minYear}`, query: without({ minYear: undefined }) });
  if (filters.maxYear != null)
    chips.push({ key: "maxYear", label: `To ${filters.maxYear}`, query: without({ maxYear: undefined }) });
  if (filters.q) chips.push({ key: "q", label: `"${filters.q}"`, query: without({ q: "" }) });
  return chips;
}

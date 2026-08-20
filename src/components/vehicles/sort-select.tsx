"use client";

import { useRouter } from "next/navigation";

import { filtersToQuery, SORT_OPTIONS, type VehicleFilters } from "@/lib/vehicle-query";

export function SortSelect({ filters }: { filters: VehicleFilters }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Sort</span>
      <select
        value={filters.sort}
        onChange={(e) =>
          router.push(`/vehicles?${filtersToQuery({ ...filters, sort: e.target.value })}`, {
            scroll: false,
          })
        }
        className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Sort vehicles"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

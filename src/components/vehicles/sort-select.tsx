"use client";

import { useRouter } from "next/navigation";

import { useT } from "@/components/i18n";
import { filtersToQuery, SORT_OPTIONS, type VehicleFilters } from "@/lib/vehicle-query";

export function SortSelect({ filters }: { filters: VehicleFilters }) {
  const router = useRouter();
  const { t } = useT();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t.list.sort}</span>
      <select
        value={filters.sort}
        onChange={(e) =>
          router.push(`/vehicles?${filtersToQuery({ ...filters, sort: e.target.value })}`, {
            scroll: false,
          })
        }
        className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t.list.sortAria}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {t.list.sorts[o.value] ?? o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

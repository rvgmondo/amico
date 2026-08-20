"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { filtersToQuery, type VehicleFilters } from "@/lib/vehicle-query";
import { cn } from "@/lib/utils";

type Facets = {
  makes: { slug: string; name: string; count: number }[];
  bodies: { value: string; label: string; count: number }[];
  fuels: { value: string; label: string; count: number }[];
  transmissions: { value: string; label: string; count: number }[];
  priceMin: number;
  priceMax: number;
  yearMin: number;
  yearMax: number;
};

export function FiltersPanel({
  facets,
  filters,
  onNavigate,
}: {
  facets: Facets;
  filters: VehicleFilters;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState(filters.q);

  React.useEffect(() => setQ(filters.q), [filters.q]);

  const apply = (patch: Partial<VehicleFilters>) => {
    const next = { ...filters, ...patch, page: 1 };
    router.push(`/vehicles?${filtersToQuery(next)}`, { scroll: false });
    onNavigate?.();
  };

  const toggle = (key: "body" | "fuel" | "transmission", value: string) => {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    apply({ [key]: next } as Partial<VehicleFilters>);
  };

  const years = React.useMemo(() => {
    const arr: number[] = [];
    for (let y = facets.yearMax; y >= facets.yearMin; y--) arr.push(y);
    return arr;
  }, [facets.yearMin, facets.yearMax]);

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Filters</h2>
        {activeCount > 0 ? (
          <Link
            href="/vehicles"
            onClick={onNavigate}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent-ink hover:underline"
          >
            <X className="size-3.5" /> Clear all
          </Link>
        ) : null}
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search make or model"
          className="pl-9"
          aria-label="Search vehicles"
        />
      </form>

      {/* Make */}
      <FilterGroup label="Make">
        <select
          value={filters.make}
          onChange={(e) => apply({ make: e.target.value })}
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filter by make"
        >
          <option value="">All makes</option>
          {facets.makes.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.name} ({m.count})
            </option>
          ))}
        </select>
      </FilterGroup>

      {/* Body type */}
      {facets.bodies.length ? (
        <FilterGroup label="Body type">
          <CheckboxList
            options={facets.bodies}
            selected={filters.body}
            onToggle={(v) => toggle("body", v)}
          />
        </FilterGroup>
      ) : null}

      {/* Price */}
      <FilterGroup label="Price">
        <div className="flex items-center gap-2">
          <RangeInput
            aria-label="Minimum price"
            placeholder={formatPrice(facets.priceMin)}
            defaultValue={filters.minPrice}
            onCommit={(n) => apply({ minPrice: n })}
          />
          <span className="text-muted-foreground">–</span>
          <RangeInput
            aria-label="Maximum price"
            placeholder={formatPrice(facets.priceMax)}
            defaultValue={filters.maxPrice}
            onCommit={(n) => apply({ maxPrice: n })}
          />
        </div>
      </FilterGroup>

      {/* Year */}
      <FilterGroup label="Year">
        <div className="flex items-center gap-2">
          <select
            value={filters.minYear ?? ""}
            onChange={(e) => apply({ minYear: e.target.value ? Number(e.target.value) : undefined })}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Minimum year"
          >
            <option value="">From</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={filters.maxYear ?? ""}
            onChange={(e) => apply({ maxYear: e.target.value ? Number(e.target.value) : undefined })}
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            aria-label="Maximum year"
          >
            <option value="">To</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </FilterGroup>

      {/* Fuel */}
      {facets.fuels.length ? (
        <FilterGroup label="Fuel">
          <CheckboxList
            options={facets.fuels}
            selected={filters.fuel}
            onToggle={(v) => toggle("fuel", v)}
          />
        </FilterGroup>
      ) : null}

      {/* Transmission */}
      {facets.transmissions.length ? (
        <FilterGroup label="Transmission">
          <CheckboxList
            options={facets.transmissions}
            selected={filters.transmission}
            onToggle={(v) => toggle("transmission", v)}
          />
        </FilterGroup>
      ) : null}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2.5 border-t border-border pt-5">
      <legend className="mb-1 text-sm font-semibold text-foreground">{label}</legend>
      {children}
    </fieldset>
  );
}

function CheckboxList({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string; count: number }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {options.map((o) => {
        const checked = selected.includes(o.value);
        return (
          <label
            key={o.value}
            className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted"
          >
            <span className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(o.value)}
                className="size-4 rounded border-input"
                style={{ accentColor: "var(--accent)" }}
              />
              <span className={cn(checked && "font-medium text-foreground")}>{o.label}</span>
            </span>
            <span className="text-xs text-muted-foreground">{o.count}</span>
          </label>
        );
      })}
    </div>
  );
}

function RangeInput({
  defaultValue,
  onCommit,
  ...props
}: {
  defaultValue?: number;
  onCommit: (n: number | undefined) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "onChange">) {
  const [val, setVal] = React.useState(defaultValue != null ? String(defaultValue) : "");
  React.useEffect(() => setVal(defaultValue != null ? String(defaultValue) : ""), [defaultValue]);
  const commit = () => onCommit(val ? Number(val.replace(/\D/g, "")) : undefined);
  return (
    <Input
      inputMode="numeric"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        }
      }}
      className="h-11"
      {...props}
    />
  );
}

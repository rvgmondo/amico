import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { filtersToQuery, type VehicleFilters } from "@/lib/vehicle-query";
import { cn } from "@/lib/utils";

export function Pagination({
  filters,
  totalPages,
}: {
  filters: VehicleFilters;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const page = filters.page;
  const href = (p: number) => `/vehicles?${filtersToQuery({ ...filters, page: p })}`;

  // Windowed page numbers around the current page.
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = Math.max(1, end - 4); p <= end; p++) pages.push(p);

  const base =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-border px-3 text-sm font-medium transition-colors";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(base, "hover:bg-muted")} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={cn(base, "cursor-not-allowed opacity-40")} aria-disabled>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            base,
            p === page ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
          )}
        >
          {p}
        </Link>
      ))}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={cn(base, "hover:bg-muted")} aria-label="Next page">
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(base, "cursor-not-allowed opacity-40")} aria-disabled>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}

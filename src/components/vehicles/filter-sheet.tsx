"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { SlidersHorizontal, X } from "lucide-react";
import * as React from "react";

import { FiltersPanel } from "@/components/vehicles/filters-panel";
import type { VehicleFilters } from "@/lib/vehicle-query";

type Facets = React.ComponentProps<typeof FiltersPanel>["facets"];

export function FilterSheet({
  facets,
  filters,
  activeCount,
  total,
}: {
  facets: Facets;
  filters: VehicleFilters;
  activeCount: number;
  total: number;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 ? (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              {activeCount}
            </span>
          ) : null}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[88%] max-w-sm flex-col bg-background shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-left">
          <div className="flex items-center justify-between border-b border-border p-4">
            <Dialog.Title className="font-display text-lg font-bold">Filter vehicles</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close filters"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <FiltersPanel facets={facets} filters={filters} />
          </div>
          <div className="border-t border-border p-4">
            <Dialog.Close asChild>
              <button
                type="button"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                Show {total} {total === 1 ? "result" : "results"}
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

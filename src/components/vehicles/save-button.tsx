"use client";

import { Heart } from "lucide-react";

import { useFavourites } from "@/lib/favourites";
import { cn } from "@/lib/utils";

export function SaveButton({
  id,
  withLabel = false,
  className,
}: {
  id: number;
  withLabel?: boolean;
  className?: string;
}) {
  const { has, toggle, ready } = useFavourites();
  const saved = ready && has(id);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save this vehicle"}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        withLabel ? "h-11 px-5" : "h-11 w-11",
        className,
      )}
    >
      <Heart className={cn("size-5", saved && "fill-destructive text-destructive")} />
      {withLabel ? (saved ? "Saved" : "Save") : null}
    </button>
  );
}

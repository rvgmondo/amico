import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function Stars({ rating = 5, className }: { rating?: number | null; className?: string }) {
  const value = Math.max(0, Math.min(5, rating ?? 5));
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("size-4", i < value ? "fill-gold-bright text-gold-bright" : "text-muted-foreground/40")}
          aria-hidden
        />
      ))}
    </div>
  );
}

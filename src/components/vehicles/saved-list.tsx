"use client";

import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/vehicles/save-button";
import { formatKm, formatPrice } from "@/lib/format";
import { useFavourites } from "@/lib/favourites";
import type { Vehicle } from "@/payload-types";

const relUrl = (u?: string | null) => (u ? u.replace(/^https?:\/\/[^/]+/, "") : null);

function cardImage(v: Vehicle): string | null {
  const first = v.images?.[0];
  if (!first || typeof first === "number") return null;
  return relUrl(first.sizes?.card?.url || first.url);
}

export function SavedList() {
  const { ids, ready } = useFavourites();
  const [vehicles, setVehicles] = React.useState<Vehicle[] | null>(null);

  React.useEffect(() => {
    if (!ready) return;
    if (!ids.length) {
      setVehicles([]);
      return;
    }
    const params = new URLSearchParams();
    ids.forEach((id, i) => params.set(`where[id][in][${i}]`, String(id)));
    params.set("depth", "1");
    params.set("limit", String(ids.length));
    fetch(`/api/vehicles?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setVehicles(d.docs ?? []))
      .catch(() => setVehicles([]));
  }, [ids, ready]);

  if (!ready || vehicles === null) {
    return <p className="py-16 text-center text-muted-foreground">Loading your saved vehicles…</p>;
  }

  if (!vehicles.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-20 text-center">
        <Heart className="size-8 text-muted-foreground" />
        <p className="font-display text-lg font-bold">No saved vehicles yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Tap the heart on any vehicle to save it here for later.
        </p>
        <Button asChild className="mt-2">
          <Link href="/vehicles">Browse stock</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((v) => {
        const src = cardImage(v);
        return (
          <article key={v.id} className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <Link href={`/vehicles/${v.slug}`} className="flex flex-1 flex-col">
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {src ? (
                  <Image src={src} alt={v.title} fill sizes="400px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="line-clamp-1 font-display font-bold">{v.title}</h3>
                <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                  {v.year ? <span>{v.year}</span> : null}
                  {typeof v.mileage === "number" ? <span>{formatKm(v.mileage)}</span> : null}
                </div>
                <span className="mt-auto font-display text-lg font-extrabold text-primary dark:text-foreground">
                  {formatPrice(v.price)}
                </span>
              </div>
            </Link>
            <div className="absolute right-3 top-3">
              <SaveButton id={v.id} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

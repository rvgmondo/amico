import { Fuel, Gauge, Settings2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatKm, formatPrice } from "@/lib/format";
import { mediaUrl, primaryImage } from "@/lib/payload";
import { FUEL_TYPES, labelFor, TRANSMISSIONS } from "@/lib/vehicle-options";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/payload-types";

export function VehicleCard({ vehicle, priority = false }: { vehicle: Vehicle; priority?: boolean }) {
  const img = primaryImage(vehicle);
  const src = mediaUrl(img, "card");
  const sold = vehicle.status === "sold";
  const reserved = vehicle.status === "reserved";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <Link
        href={`/vehicles/${vehicle.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {src ? (
            <Image
              src={src}
              alt={img?.alt || vehicle.title}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
              className={cn(
                "object-cover transition-transform duration-500 group-hover:scale-105",
                sold && "opacity-70",
              )}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
          )}

          <div className="absolute left-3 top-3 flex gap-2">
            {sold ? (
              <Badge variant="sale">Sold</Badge>
            ) : reserved ? (
              <Badge variant="navy">Reserved</Badge>
            ) : vehicle.featured ? (
              <Badge variant="gold">Featured</Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex flex-col gap-1">
            <h3 className="line-clamp-1 font-display text-base font-bold tracking-tight text-foreground">
              {vehicle.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {vehicle.year ? <span>{vehicle.year}</span> : null}
              {typeof vehicle.mileage === "number" ? (
                <span className="inline-flex items-center gap-1">
                  <Gauge className="size-3.5" aria-hidden /> {formatKm(vehicle.mileage)}
                </span>
              ) : null}
              {vehicle.transmission ? (
                <span className="inline-flex items-center gap-1">
                  <Settings2 className="size-3.5" aria-hidden />
                  {labelFor(TRANSMISSIONS, vehicle.transmission)}
                </span>
              ) : null}
              {vehicle.fuelType ? (
                <span className="inline-flex items-center gap-1">
                  <Fuel className="size-3.5" aria-hidden /> {labelFor(FUEL_TYPES, vehicle.fuelType)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between pt-1">
            <span className="font-display text-xl font-extrabold tracking-tight text-primary dark:text-foreground">
              {formatPrice(vehicle.price)}
            </span>
            <span className="text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
              View details →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

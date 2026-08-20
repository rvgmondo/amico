import {
  Calendar,
  ChevronRight,
  Fuel,
  Gauge,
  MapPin,
  Palette,
  Phone,
  Settings2,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RichText } from "@/components/rich-text";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Gallery, type Photo } from "@/components/vehicles/gallery";
import { VehicleActions } from "@/components/vehicles/vehicle-actions";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { formatKm, formatPrice, monthlyInstalment } from "@/lib/format";
import { lexicalToText } from "@/lib/lexical";
import { getRelatedVehicles, getSettings, getVehicleBySlug, mediaUrl } from "@/lib/payload";
import {
  BODY_TYPES,
  CONDITIONS,
  DRIVETRAINS,
  FUEL_TYPES,
  labelFor,
  TRANSMISSIONS,
} from "@/lib/vehicle-options";
import type { Media, Vehicle } from "@/payload-types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return { title: "Vehicle not found" };
  const desc =
    lexicalToText(vehicle.description as never, 155) ||
    `${vehicle.title} for sale at Amico Motors, Pretoria. ${formatPrice(vehicle.price)}.`;
  const img = vehicle.images?.[0];
  const ogUrl = img && typeof img !== "number" ? mediaUrl(img, "og") : null;
  return {
    title: vehicle.title,
    description: desc,
    alternates: { canonical: `/vehicles/${slug}` },
    openGraph: {
      title: `${vehicle.title} — Amico Motors`,
      description: desc,
      images: ogUrl ? [{ url: ogUrl, width: 1200, height: 630 }] : undefined,
      type: "website",
    },
  };
}

function toPhotos(vehicle: Vehicle): Photo[] {
  return (vehicle.images ?? [])
    .filter((m): m is Media => typeof m !== "number")
    .map((m) => ({
      full: mediaUrl(m, "feature") ?? mediaUrl(m) ?? "",
      thumb: mediaUrl(m, "thumbnail") ?? mediaUrl(m) ?? "",
      alt: m.alt || vehicle.title,
    }))
    .filter((p) => p.full);
}

function specRows(vehicle: Vehicle): [string, string][] {
  const rows: [string, string | undefined | null][] = [
    ["Year", vehicle.year ? String(vehicle.year) : undefined],
    ["Mileage", typeof vehicle.mileage === "number" ? formatKm(vehicle.mileage) : undefined],
    ["Body type", vehicle.bodyType ? labelFor(BODY_TYPES, vehicle.bodyType) : undefined],
    ["Fuel", vehicle.fuelType ? labelFor(FUEL_TYPES, vehicle.fuelType) : undefined],
    ["Transmission", vehicle.transmission ? labelFor(TRANSMISSIONS, vehicle.transmission) : undefined],
    ["Drivetrain", vehicle.drivetrain ? labelFor(DRIVETRAINS, vehicle.drivetrain) : undefined],
    ["Engine", vehicle.engine || undefined],
    ["Power", vehicle.power || undefined],
    ["Exterior colour", vehicle.exteriorColour || undefined],
    ["Interior colour", vehicle.interiorColour || undefined],
    ["Condition", vehicle.condition ? labelFor(CONDITIONS, vehicle.condition) : undefined],
    ["Stock no.", vehicle.stockNumber || undefined],
  ];
  return rows.filter((r): r is [string, string] => Boolean(r[1]));
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const [settings, related] = await Promise.all([getSettings(), getRelatedVehicles(vehicle, 3)]);
  const photos = toPhotos(vehicle);
  const specs = specRows(vehicle);
  const make = typeof vehicle.make === "object" ? vehicle.make : null;

  const rate = settings.finance?.defaultRate ?? 11.75;
  const term = settings.finance?.defaultTermMonths ?? 72;
  const depositPct = settings.finance?.defaultDepositPercent ?? 10;
  const monthly = vehicle.price
    ? monthlyInstalment(vehicle.price * (1 - depositPct / 100), rate, term)
    : null;

  const quickSpecs = [
    vehicle.year ? { icon: Calendar, label: String(vehicle.year) } : null,
    typeof vehicle.mileage === "number" ? { icon: Gauge, label: formatKm(vehicle.mileage) } : null,
    vehicle.transmission
      ? { icon: Settings2, label: labelFor(TRANSMISSIONS, vehicle.transmission) }
      : null,
    vehicle.fuelType ? { icon: Fuel, label: labelFor(FUEL_TYPES, vehicle.fuelType) } : null,
    vehicle.exteriorColour ? { icon: Palette, label: vehicle.exteriorColour } : null,
  ].filter(Boolean) as { icon: typeof Calendar; label: string }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: vehicle.title,
    brand: make?.name,
    vehicleModelDate: vehicle.year,
    mileageFromOdometer: vehicle.mileage
      ? { "@type": "QuantitativeValue", value: vehicle.mileage, unitCode: "KMT" }
      : undefined,
    fuelType: vehicle.fuelType,
    vehicleTransmission: vehicle.transmission,
    color: vehicle.exteriorColour,
    image: photos[0]?.full,
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: "ZAR",
      availability:
        vehicle.status === "sold"
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: { "@type": "AutoDealer", name: "Amico Motors" },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container className="py-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href="/vehicles" className="hover:text-foreground">
            Vehicles
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="line-clamp-1 text-foreground">{vehicle.title}</span>
        </nav>
      </Container>

      <Container className="grid gap-8 pb-12 lg:grid-cols-[1.55fr_1fr]">
        <div className="flex flex-col gap-8">
          <Gallery photos={photos} title={vehicle.title} />

          {vehicle.description ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-bold">Overview</h2>
              <RichText data={vehicle.description as never} />
            </section>
          ) : null}

          {vehicle.features?.length ? (
            <section className="flex flex-col gap-3">
              <h2 className="font-display text-xl font-bold">Key features</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {vehicle.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="inline-block size-1.5 rounded-full bg-accent" /> {f.feature}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-bold">Specifications</h2>
            <dl className="grid grid-cols-1 overflow-hidden rounded-xl border border-border sm:grid-cols-2">
              {specs.map(([label, value], i) => (
                <div
                  key={label}
                  className={`flex items-center justify-between gap-4 px-4 py-3 text-sm ${
                    i % 2 === 0 ? "bg-card" : "bg-subtle"
                  }`}
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* Summary card */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {vehicle.status === "reserved" ? <Badge variant="navy">Reserved</Badge> : null}
                {vehicle.status === "sold" ? <Badge variant="sale">Sold</Badge> : null}
                {vehicle.featured ? <Badge variant="goldSoft">Featured</Badge> : null}
                {make ? <Badge variant="muted">{make.name}</Badge> : null}
              </div>
              <h1 className="font-display text-2xl font-bold leading-tight tracking-tight">
                {vehicle.title}
              </h1>
              <p className="font-display text-3xl font-extrabold text-primary dark:text-foreground">
                {formatPrice(vehicle.price)}
              </p>
              {monthly ? (
                <p className="text-sm text-muted-foreground">
                  Finance from{" "}
                  <span className="font-semibold text-foreground">
                    {formatPrice(monthly)}/mo
                  </span>{" "}
                  <Link href="/finance#calculator" className="text-accent-ink hover:underline">
                    (estimate)
                  </Link>
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 border-y border-border py-4">
              {quickSpecs.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-sm">
                  <s.icon className="size-4 text-accent" />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>

            <VehicleActions
              vehicle={{ id: vehicle.id, title: vehicle.title, slug: vehicle.slug ?? slug }}
              whatsapp={settings.contact?.whatsappNumber ? { number: settings.contact.whatsappNumber } : null}
            />

            <div className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
              {settings.contact?.phones?.[0]?.number ? (
                <a
                  href={`tel:${settings.contact.phones[0].number.replace(/[^\d+]/g, "")}`}
                  className="flex items-center gap-2 hover:text-accent"
                >
                  <Phone className="size-4 text-accent" /> {settings.contact.phones[0].number}
                </a>
              ) : null}
              {settings.contact?.street ? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="size-4 text-accent" /> {settings.contact.suburb},{" "}
                  {settings.contact.city}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Container>

      {related.length ? (
        <section className="border-t border-border bg-subtle py-14">
          <Container className="flex flex-col gap-8">
            <h2 className="font-display text-2xl font-bold">You might also like</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}

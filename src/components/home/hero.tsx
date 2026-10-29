import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { formatPrice } from "@/lib/format";
import type { Dict } from "@/lib/i18n";
import { mediaUrl, primaryImage } from "@/lib/payload";
import type { SiteSetting, Vehicle } from "@/payload-types";

export function Hero({
  featured,
  stockCount,
  whatsappHref,
  t,
}: {
  t: Dict;
  featured: Vehicle | null;
  stockCount: number;
  whatsappHref: string | null;
  settings: SiteSetting;
}) {
  const img = featured ? primaryImage(featured) : null;
  const src = mediaUrl(img, "feature");

  return (
    <section className="relative overflow-hidden bg-navy-gradient text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl"
      />
      <Container className="relative grid items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <ShieldCheck className="size-4" /> SA Multi Franchise Group
          </span>
          <h1 className="text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {t.hero.title1} <span className="text-accent">{t.hero.title2}</span>
          </h1>
          <p className="max-w-xl text-pretty text-lg text-white/80">
            {t.hero.lead}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="accent" size="lg">
              <Link href="/vehicles">
                {t.hero.browse} <ArrowRight className="size-4" />
              </Link>
            </Button>
            {whatsappHref ? (
              <Button asChild variant="whatsapp" size="lg">
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" /> {t.common.whatsappUs}
                </a>
              </Button>
            ) : null}
          </div>
          <dl className="mt-2 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="text-2xl font-extrabold text-accent">{stockCount}+</dt>
              <dd className="text-sm text-white/70">{t.hero.inStock}</dd>
            </div>
            <div>
              <dt className="text-2xl font-extrabold text-accent">{t.hero.banks}</dt>
              <dd className="text-sm text-white/70">{t.hero.banksSub}</dd>
            </div>
            <div>
              <dt className="text-2xl font-extrabold text-accent">{t.hero.tradeIns}</dt>
              <dd className="text-sm text-white/70">{t.hero.tradeInsSub}</dd>
            </div>
          </dl>
        </div>

        {featured && src ? (
          <Link
            href={`/vehicles/${featured.slug}`}
            className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="relative aspect-[16/11]">
              <Image
                src={src}
                alt={img?.alt || featured.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 560px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  {t.common.featured}
                </span>
                <p className="font-display text-lg font-bold leading-tight text-white">
                  {featured.title}
                </p>
              </div>
              <span className="rounded-full bg-accent px-3 py-1.5 font-display text-sm font-extrabold text-accent-foreground">
                {formatPrice(featured.price)}
              </span>
            </div>
          </Link>
        ) : null}
      </Container>
    </section>
  );
}

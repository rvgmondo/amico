import { Award, Banknote, CarFront, Clock, Handshake, HandCoins, MapPin, Phone, Quote } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Hero } from "@/components/home/hero";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stars } from "@/components/ui/stars";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { hoursSummary } from "@/lib/i18n";
import { getT } from "@/lib/i18n-server";
import {
  getClient,
  getFeaturedVehicles,
  getSettings,
  getTestimonials,
} from "@/lib/payload";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const WHY_ICONS = [Handshake, CarFront, Banknote, Award];

export default async function HomePage() {
  const payload = await getClient();
  const [featured, testimonials, settings, stock, { lang, t }] = await Promise.all([
    getFeaturedVehicles(8),
    getTestimonials(6),
    getSettings(),
    payload.count({ collection: "vehicles", where: { status: { not_equals: "sold" } } }),
    getT(),
  ]);

  const c = settings.contact;
  const whatsappHref = c?.whatsappNumber
    ? `https://wa.me/${c.whatsappNumber}?text=${encodeURIComponent(c.whatsappMessage || "")}`
    : null;

  return (
    <>
      <Hero
        featured={featured[0] ?? null}
        stockCount={stock.totalDocs}
        whatsappHref={whatsappHref}
        settings={settings}
        t={t}
      />

      {/* Featured inventory */}
      <section className="py-16 sm:py-20">
        <Container className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow={t.home.latestEyebrow}
              title={t.home.latestTitle}
              description={t.home.latestLead}
            />
            <Button asChild variant="outline">
              <Link href="/vehicles">{t.home.viewAll}</Link>
            </Button>
          </div>
          <Reveal className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((v, i) => (
              <VehicleCard key={v.id} vehicle={v} priority={i < 4} lang={lang} />
            ))}
          </Reveal>
        </Container>
      </section>

      {/* Why choose us */}
      <section className="bg-subtle py-16 sm:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            align="center"
            className="mx-auto"
            eyebrow={t.home.whyEyebrow}
            title={t.home.whyTitle}
            description={t.home.whyLead}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.home.why.map((item, i) => {
              const Icon = WHY_ICONS[i];
              return (
              <div key={item.title} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Icon className="size-6" />
                </span>
                <h3 className="font-display text-lg font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Finance + trade-in teasers */}
      <section className="py-16 sm:py-20">
        <Container className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col justify-between gap-6 rounded-2xl bg-navy-gradient p-8 text-white sm:p-10">
            <div className="flex flex-col gap-3">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-white/10 text-accent">
                <Banknote className="size-6" />
              </span>
              <h3 className="font-display text-2xl font-bold">{t.home.financeTitle}</h3>
              <p className="text-white/80">
                {t.home.financeBody}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="accent">
                <Link href="/finance">{t.home.applyFinance}</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                <Link href="/finance#calculator">{t.home.calculator}</Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)] sm:p-10">
            <div className="flex flex-col gap-3">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                <HandCoins className="size-6" />
              </span>
              <h3 className="font-display text-2xl font-bold">{t.home.sellTitle}</h3>
              <p className="text-muted-foreground">
                {t.home.sellBody}
              </p>
            </div>
            <div>
              <Button asChild>
                <Link href="/sell-your-car">{t.home.valuation}</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Testimonials */}
      <section className="bg-subtle py-16 sm:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            align="center"
            className="mx-auto"
            eyebrow={t.home.saysEyebrow}
            title={t.home.saysTitle}
          />
          <Reveal className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.id}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
              >
                <Quote className="size-7 text-accent/40" aria-hidden />
                <blockquote className="flex-1 text-pretty text-sm leading-relaxed text-foreground">
                  {t.quote}
                </blockquote>
                <figcaption className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="font-display text-sm font-bold">{t.author}</span>
                  <Stars rating={t.rating} />
                </figcaption>
              </figure>
            ))}
          </Reveal>
        </Container>
      </section>

      {/* Location */}
      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-5">
            <SectionHeading eyebrow={t.footer.visit} title={t.home.visitTitle} />
            <ul className="flex flex-col gap-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 text-accent" />
                <span>
                  {c?.street}, {c?.suburb}, {c?.city} {c?.postalCode}
                </span>
              </li>
              {c?.phones?.[0]?.number ? (
                <li className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-5 text-accent" />
                  <a href={`tel:${c.phones[0].number.replace(/[^\d+]/g, "")}`} className="hover:text-accent">
                    {c.phones[0].number}
                  </a>
                </li>
              ) : null}
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 text-accent" />
                <span>{hoursSummary(lang, settings.hours)}</span>
              </li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact">{t.common.contactUs}</Link>
              </Button>
              {whatsappHref ? (
                <Button asChild variant="outline">
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    {t.common.whatsappUs}
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          {settings.location?.mapEmbedUrl ? (
            <div className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-card)]">
              <iframe
                title={t.common.mapTitle}
                src={settings.location.mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-[16/11] w-full"
              />
            </div>
          ) : null}
        </Container>
      </section>
    </>
  );
}

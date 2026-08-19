import { Award, Banknote, CarFront, Clock, Handshake, HandCoins, MapPin, Phone, Quote } from "lucide-react";
import Link from "next/link";

import { Hero } from "@/components/home/hero";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stars } from "@/components/ui/stars";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import {
  getClient,
  getFeaturedVehicles,
  getSettings,
  getTestimonials,
} from "@/lib/payload";

const WHY_US = [
  {
    icon: Handshake,
    title: "Client satisfaction",
    body: "Your satisfaction is our priority. Individual attention and excellent after-sales service, every time.",
  },
  {
    icon: CarFront,
    title: "Wide selection",
    body: "A fine selection of good-quality used vehicles to suit your needs and your pocket.",
  },
  {
    icon: Banknote,
    title: "Easy finance",
    body: "An approved dealer with most major banks, with friendly help through your application.",
  },
  {
    icon: Award,
    title: "High standards",
    body: "Every vehicle is checked against the highest standards before it reaches our floor.",
  },
];

export default async function HomePage() {
  const payload = await getClient();
  const [featured, testimonials, settings, stock] = await Promise.all([
    getFeaturedVehicles(8),
    getTestimonials(6),
    getSettings(),
    payload.count({ collection: "vehicles", where: { status: { not_equals: "sold" } } }),
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
      />

      {/* Featured inventory */}
      <section className="py-16 sm:py-20">
        <Container className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Our latest selection"
              title="Featured vehicles"
              description="A handpicked look at what's on the floor right now."
            />
            <Button asChild variant="outline">
              <Link href="/vehicles">View all stock</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((v, i) => (
              <VehicleCard key={v.id} vehicle={v} priority={i < 4} />
            ))}
          </div>
        </Container>
      </section>

      {/* Why choose us */}
      <section className="bg-subtle py-16 sm:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            align="center"
            className="mx-auto"
            eyebrow="Why choose us"
            title="Buying a car should feel good"
            description="Trusted, transparent and no pressure. We help you find the right car, the honest way."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map((item) => (
              <div key={item.title} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <item.icon className="size-6" />
                </span>
                <h3 className="font-display text-lg font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </div>
            ))}
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
              <h3 className="font-display text-2xl font-bold">Finance made easy</h3>
              <p className="text-white/80">
                Pre-approved finance through most major banks. Estimate your monthly repayment and
                apply online in minutes.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="accent">
                <Link href="/finance">Apply for finance</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                <Link href="/finance#calculator">Finance calculator</Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)] sm:p-10">
            <div className="flex flex-col gap-3">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                <HandCoins className="size-6" />
              </span>
              <h3 className="font-display text-2xl font-bold">Sell or trade in your car</h3>
              <p className="text-muted-foreground">
                Get a fair, no-obligation valuation. Tell us about your car and we'll be in touch
                with an offer.
              </p>
            </div>
            <div>
              <Button asChild>
                <Link href="/sell-your-car">Get a valuation</Link>
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
            eyebrow="What people say"
            title="Loved by our customers"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>
        </Container>
      </section>

      {/* Location */}
      <section className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-5">
            <SectionHeading eyebrow="Visit us" title="Come and see the cars in person" />
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
                <span>Mon–Fri 8:00–17:00 · Sat 8:00–13:00 · Sun closed</span>
              </li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/contact">Contact us</Link>
              </Button>
              {whatsappHref ? (
                <Button asChild variant="outline">
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    WhatsApp us
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          {settings.location?.mapEmbedUrl ? (
            <div className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-card)]">
              <iframe
                title="Amico Motors location"
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

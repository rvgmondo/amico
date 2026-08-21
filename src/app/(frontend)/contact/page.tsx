import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";

import { ContactForm } from "@/components/forms/contact-form";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { getSettings } from "@/lib/payload";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Visit Amico Motors at 505 Swemmer Street, Gezina, Pretoria. Call, WhatsApp or send us a message and we'll get back to you.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSettings();
  const c = settings.contact;
  const whatsappHref = c?.whatsappNumber
    ? `https://wa.me/${c.whatsappNumber}?text=${encodeURIComponent(c.whatsappMessage || "")}`
    : null;

  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Contact us"
        description="Pop in for a test drive, give us a call, or send a message and we'll be in touch."
      />
      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <ContactRow icon={MapPin} label="Address">
              {c?.street}, {c?.suburb}, {c?.city} {c?.postalCode}
            </ContactRow>
            {c?.phones?.map((p, i) => (
              <ContactRow key={i} icon={Phone} label={p.label ?? "Phone"}>
                <a href={`tel:${(p.number ?? "").replace(/[^\d+]/g, "")}`} className="hover:text-accent">
                  {p.number}
                </a>
              </ContactRow>
            ))}
            {c?.email ? (
              <ContactRow icon={Mail} label="Email">
                <a href={`mailto:${c.email}`} className="hover:text-accent">
                  {c.email}
                </a>
              </ContactRow>
            ) : null}
            <ContactRow icon={Clock} label="Hours">
              <ul className="flex flex-col gap-0.5">
                {settings.hours?.map((h, i) => (
                  <li key={i} className="flex justify-between gap-6">
                    <span>{h.day}</span>
                    <span className="text-muted-foreground">
                      {h.closed ? "Closed" : `${h.open}-${h.close}`}
                    </span>
                  </li>
                ))}
              </ul>
            </ContactRow>
          </div>

          {whatsappHref ? (
            <Button asChild variant="whatsapp" className="w-full">
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" /> Chat on WhatsApp
              </a>
            </Button>
          ) : null}

          {settings.location?.mapEmbedUrl ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <iframe
                title="Amico Motors location"
                src={settings.location.mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-[16/10] w-full"
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="font-display text-2xl font-bold">Send us a message</h2>
          <ContactForm />
        </div>
      </Container>
    </>
  );
}

function ContactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Icon className="size-4" />
      </span>
      <div className="flex flex-col text-sm">
        <span className="font-semibold">{label}</span>
        <div className="text-foreground/90">{children}</div>
      </div>
    </div>
  );
}

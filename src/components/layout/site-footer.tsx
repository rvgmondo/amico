import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import type { Navigation, SiteSetting } from "@/payload-types";

export function SiteFooter({
  settings,
  footerColumns,
}: {
  settings: SiteSetting;
  footerColumns?: Navigation["footerColumns"];
}) {
  const c = settings.contact;
  const year = new Date().getFullYear();
  const whatsappHref = c?.whatsappNumber
    ? `https://wa.me/${c.whatsappNumber}?text=${encodeURIComponent(c.whatsappMessage || "")}`
    : null;

  return (
    <footer className="mt-auto bg-surface-navy text-surface-navy-foreground">
      <Container className="grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Link href="/" className="font-display text-2xl font-extrabold tracking-tight text-white">
            Amico<span className="text-accent">Motors</span>
          </Link>
          <p className="max-w-xs text-sm text-surface-navy-muted">
            {settings.tagline || "Quality used cars in Pretoria, with honest, friendly service."}
          </p>
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition-[filter] hover:brightness-95"
            >
              <MessageCircle className="size-4" /> Chat on WhatsApp
            </a>
          ) : null}
        </div>

        {(footerColumns ?? []).map((col, i) => (
          <nav key={i} aria-label={col.heading ?? "Footer"} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-navy-muted">
              {col.heading}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {(col.links ?? []).map((link, j) => (
                <li key={j}>
                  <Link
                    href={link.url}
                    className="text-sm text-surface-navy-foreground/85 transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-surface-navy-muted">
            Visit us
          </h2>
          <address className="flex flex-col gap-2.5 text-sm not-italic text-surface-navy-foreground/85">
            {c?.street ? (
              <span className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>
                  {c.street}, {c.suburb}, {c.city} {c.postalCode}
                </span>
              </span>
            ) : null}
            {c?.phones?.[0]?.number ? (
              <a href={`tel:${c.phones[0].number.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 hover:text-accent">
                <Phone className="size-4 shrink-0 text-accent" />
                {c.phones[0].number}
              </a>
            ) : null}
            {c?.email ? (
              <a href={`mailto:${c.email}`} className="flex items-center gap-2 hover:text-accent">
                <Mail className="size-4 shrink-0 text-accent" />
                {c.email}
              </a>
            ) : null}
            {settings.hours?.length ? (
              <span className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>Mon–Fri 8:00–17:00 · Sat 8:00–13:00</span>
              </span>
            ) : null}
          </address>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-5 text-xs text-surface-navy-muted sm:flex-row">
          <p>
            © {year} {settings.dealershipName || "Amico Motors"}
            {settings.legalName ? ` · ${settings.legalName}` : ""}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-accent">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-accent">
              Terms
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}

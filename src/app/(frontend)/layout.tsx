import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";
import { Toaster } from "sonner";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getNavigation, getSettings } from "@/lib/payload";

import "../globals.css";

const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"),
  title: {
    default: "Amico Motors — Quality Used Cars in Pretoria",
    template: "%s — Amico Motors",
  },
  description:
    "Amico Motors (SA Multi Franchise Group) — a fine selection of quality used vehicles in Gezina, Pretoria, with easy bank finance and honest, friendly service.",
  keywords: [
    "used cars Pretoria",
    "cars for sale Gezina",
    "car finance South Africa",
    "bakkies for sale Pretoria",
    "trade in my car",
    "Amico Motors",
  ],
  openGraph: {
    type: "website",
    siteName: "Amico Motors",
    locale: "en_ZA",
    title: "Amico Motors — Quality Used Cars in Pretoria",
    description:
      "A fine selection of quality used vehicles in Gezina, Pretoria, with easy bank finance and honest, friendly service.",
  },
  twitter: { card: "summary_large_image" },
};

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [settings, nav] = await Promise.all([getSettings(), getNavigation()]);
  const c = settings.contact;
  const whatsappHref = c?.whatsappNumber
    ? `https://wa.me/${c.whatsappNumber}?text=${encodeURIComponent(c.whatsappMessage || "")}`
    : null;
  const phone = c?.phones?.[0]?.number ?? null;

  const base = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: settings.dealershipName || "Amico Motors",
    description: settings.tagline || undefined,
    url: base,
    telephone: phone || undefined,
    email: c?.email || undefined,
    priceRange: "R",
    areaServed: "Pretoria, Gauteng",
    address: c?.street
      ? {
          "@type": "PostalAddress",
          streetAddress: c.street,
          addressLocality: c.suburb,
          addressRegion: "Gauteng",
          postalCode: c.postalCode,
          addressCountry: "ZA",
        }
      : undefined,
    geo: settings.location?.latitude
      ? {
          "@type": "GeoCoordinates",
          latitude: settings.location.latitude,
          longitude: settings.location.longitude,
        }
      : undefined,
    openingHoursSpecification: settings.hours
      ?.filter((h) => !h.closed && h.open && h.close)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.day,
        opens: h.open,
        closes: h.close,
      })),
  };

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${montserrat.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Skip to content
          </a>
          <SiteHeader
            links={nav.header ?? []}
            cta={nav.headerCta?.url ? { label: nav.headerCta.label ?? "Browse", url: nav.headerCta.url } : null}
            phone={phone}
            whatsappHref={whatsappHref}
          />
          <main id="main" className="flex flex-1 flex-col">
            {children}
          </main>
          <SiteFooter settings={settings} footerColumns={nav.footerColumns} />
          {whatsappHref ? <WhatsAppButton href={whatsappHref} /> : null}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}

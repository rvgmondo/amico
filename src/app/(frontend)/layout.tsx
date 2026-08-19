import type { Metadata } from "next";
import { Montserrat, Open_Sans } from "next/font/google";

import "../globals.css";

// Amico's real brand faces: Montserrat for display, Open Sans for body.
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"),
  title: {
    default: "Amico Motors — Quality Used Cars in Pretoria",
    template: "%s — Amico Motors",
  },
  description:
    "Amico Motors (SA Multi Franchise Group) — a fine selection of quality used vehicles in Gezina, Pretoria, with easy bank finance and honest, friendly service.",
};

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

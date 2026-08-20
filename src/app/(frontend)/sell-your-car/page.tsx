import { ClipboardList, HandCoins, PhoneCall } from "lucide-react";
import type { Metadata } from "next";

import { TradeInForm } from "@/components/forms/trade-in-form";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

export const metadata: Metadata = {
  title: "Sell or Trade In Your Car",
  description:
    "Get a fair, no-obligation valuation for your car from Amico Motors in Pretoria. Tell us about your vehicle and we'll be in touch with an offer.",
  alternates: { canonical: "/sell-your-car" },
};

const STEPS = [
  { icon: ClipboardList, title: "Tell us about your car", body: "Fill in the quick form with your car's details and condition." },
  { icon: HandCoins, title: "Get a fair valuation", body: "We review the details and prepare a competitive, honest offer." },
  { icon: PhoneCall, title: "We're in touch", body: "We contact you to finalise the offer and the next steps." },
];

export default function SellYourCarPage() {
  return (
    <>
      <PageHero
        eyebrow="Sell or trade in"
        title="Sell your car to Amico Motors"
        description="A fair, no-obligation valuation with no pressure. Trade in towards your next car, or sell outright."
      />

      <Container className="py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <s.icon className="size-5" />
                </span>
                <span className="font-display text-3xl font-extrabold text-border">{i + 1}</span>
              </div>
              <h2 className="font-display text-lg font-bold">{s.title}</h2>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="pb-16">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
          <h2 className="mb-6 font-display text-2xl font-bold">Your car&apos;s details</h2>
          <TradeInForm />
        </div>
      </Container>
    </>
  );
}

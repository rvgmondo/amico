import { FileText, Landmark } from "lucide-react";
import type { Metadata } from "next";

import { FinanceCalculator } from "@/components/forms/finance-calculator";
import { FinanceForm } from "@/components/forms/finance-form";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { getSettings, getVehicleBySlug } from "@/lib/payload";

export const metadata: Metadata = {
  title: "Vehicle Finance",
  description:
    "Estimate your monthly repayment and apply for vehicle finance with Amico Motors. An approved dealer with most major banks in South Africa.",
  alternates: { canonical: "/finance" },
};

const DOCS = [
  "South African ID document",
  "Valid driver's licence",
  "Latest 3 months' bank statements",
  "Latest payslip / proof of income",
  "Proof of residence (not older than 3 months)",
];

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string }>;
}) {
  const { vehicle: vehicleSlug } = await searchParams;
  const [settings, vehicle] = await Promise.all([
    getSettings(),
    vehicleSlug ? getVehicleBySlug(vehicleSlug) : Promise.resolve(null),
  ]);
  const f = settings.finance;

  return (
    <>
      <PageHero
        eyebrow="Finance made easy"
        title="Vehicle finance"
        description="An approved dealer with most major banks. Estimate your monthly repayment, then apply online and we'll help with the rest."
      />

      <Container className="grid gap-10 py-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          <h2 className="font-display text-2xl font-bold">Repayment calculator</h2>
          <FinanceCalculator
            defaultPrice={vehicle?.price ?? 250000}
            defaultRate={f?.defaultRate ?? 11.75}
            defaultTerm={f?.defaultTermMonths ?? 72}
            defaultDepositPercent={f?.defaultDepositPercent ?? 10}
            disclaimer={f?.disclaimer}
          />

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-accent" />
              <h3 className="font-display text-lg font-bold">What you&apos;ll need</h3>
            </div>
            <ul className="flex flex-col gap-2">
              {DOCS.map((d) => (
                <li key={d} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-block size-1.5 rounded-full bg-accent" /> {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Landmark className="size-5 text-accent" />
            <h2 className="font-display text-2xl font-bold">Apply for finance</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Start your application below and our finance team will contact you to complete your
            pre-approval securely.
          </p>
          <FinanceForm vehicleTitle={vehicle?.title} />
        </div>
      </Container>
    </>
  );
}

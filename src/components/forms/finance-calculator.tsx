"use client";

import * as React from "react";

import { useT } from "@/components/i18n";
import { formatPrice, monthlyInstalment } from "@/lib/format";

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="font-display text-sm font-bold text-foreground">{value}</span>
      </div>
      {children}
    </div>
  );
}

const rangeCls =
  "w-full accent-[var(--accent)] cursor-pointer";

export function FinanceCalculator({
  defaultPrice = 250000,
  defaultRate = 11.75,
  defaultTerm = 72,
  defaultDepositPercent = 10,
  disclaimer,
}: {
  defaultPrice?: number;
  defaultRate?: number;
  defaultTerm?: number;
  defaultDepositPercent?: number;
  disclaimer?: string | null;
}) {
  const { lang, t } = useT();
  const [price, setPrice] = React.useState(defaultPrice);
  const [deposit, setDeposit] = React.useState(Math.round((defaultPrice * defaultDepositPercent) / 100));
  const [term, setTerm] = React.useState(defaultTerm);
  const [rate, setRate] = React.useState(defaultRate);

  const principal = Math.max(0, price - deposit);
  const monthly = principal > 0 ? monthlyInstalment(principal, rate, term) : 0;

  return (
    <div id="calculator" className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <Row label={t.calc.price} value={formatPrice(price)}>
          <input
            type="range"
            min={30000}
            max={1500000}
            step={5000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className={rangeCls}
            aria-label={t.calc.price}
          />
        </Row>
        <Row label={t.calc.deposit} value={formatPrice(deposit)}>
          <input
            type="range"
            min={0}
            max={price}
            step={5000}
            value={Math.min(deposit, price)}
            onChange={(e) => setDeposit(Number(e.target.value))}
            className={rangeCls}
            aria-label={t.calc.deposit}
          />
        </Row>
        <Row label={t.calc.term} value={t.calc.months(term)}>
          <input
            type="range"
            min={12}
            max={84}
            step={6}
            value={term}
            onChange={(e) => setTerm(Number(e.target.value))}
            className={rangeCls}
            aria-label={t.calc.termAria}
          />
        </Row>
        <Row label={t.calc.rate} value={`${rate.toFixed(2)}%`}>
          <input
            type="range"
            min={7}
            max={20}
            step={0.25}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className={rangeCls}
            aria-label={t.calc.rateAria}
          />
        </Row>
      </div>

      <div className="flex flex-col items-center gap-1 rounded-xl bg-navy-gradient p-6 text-center text-white">
        <span className="text-sm text-white/70">{t.calc.monthly}</span>
        <span className="font-display text-4xl font-extrabold text-accent">
          {formatPrice(monthly)}
        </span>
        <span className="text-xs text-white/60">
          {t.calc.over(term, rate.toFixed(2), formatPrice(principal))}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {/* The admin's disclaimer is English; Afrikaans readers get the same words in Afrikaans. */}
        {lang === "af" ? t.calc.disclaimer : disclaimer || t.calc.disclaimer}
      </p>
    </div>
  );
}

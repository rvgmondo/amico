"use client";

import * as React from "react";

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
  const [price, setPrice] = React.useState(defaultPrice);
  const [deposit, setDeposit] = React.useState(Math.round((defaultPrice * defaultDepositPercent) / 100));
  const [term, setTerm] = React.useState(defaultTerm);
  const [rate, setRate] = React.useState(defaultRate);

  const principal = Math.max(0, price - deposit);
  const monthly = principal > 0 ? monthlyInstalment(principal, rate, term) : 0;

  return (
    <div id="calculator" className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <Row label="Vehicle price" value={formatPrice(price)}>
          <input
            type="range"
            min={30000}
            max={1500000}
            step={5000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className={rangeCls}
            aria-label="Vehicle price"
          />
        </Row>
        <Row label="Deposit" value={formatPrice(deposit)}>
          <input
            type="range"
            min={0}
            max={price}
            step={5000}
            value={Math.min(deposit, price)}
            onChange={(e) => setDeposit(Number(e.target.value))}
            className={rangeCls}
            aria-label="Deposit"
          />
        </Row>
        <Row label="Term" value={`${term} months`}>
          <input
            type="range"
            min={12}
            max={84}
            step={6}
            value={term}
            onChange={(e) => setTerm(Number(e.target.value))}
            className={rangeCls}
            aria-label="Loan term in months"
          />
        </Row>
        <Row label="Interest rate" value={`${rate.toFixed(2)}%`}>
          <input
            type="range"
            min={7}
            max={20}
            step={0.25}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className={rangeCls}
            aria-label="Annual interest rate"
          />
        </Row>
      </div>

      <div className="flex flex-col items-center gap-1 rounded-xl bg-navy-gradient p-6 text-center text-white">
        <span className="text-sm text-white/70">Estimated monthly instalment</span>
        <span className="font-display text-4xl font-extrabold text-accent">
          {formatPrice(monthly)}
        </span>
        <span className="text-xs text-white/60">
          over {term} months at {rate.toFixed(2)}%, financing {formatPrice(principal)}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        {disclaimer ||
          "This is an estimate only and not a quote or offer of finance. Actual terms depend on credit approval and the bank's rate."}
      </p>
    </div>
  );
}

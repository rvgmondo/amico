/** South-African formatting helpers (ZAR currency, km, dates). */

const zar = new Intl.NumberFormat("en-ZA");

/** 219900 -> "R219 900" (space thousands separator, no decimals). */
export const formatPrice = (n?: number | null): string =>
  typeof n === "number" ? `R${zar.format(Math.round(n))}` : "POA";

/** 120000 -> "120 000 km". */
export const formatKm = (n?: number | null): string =>
  typeof n === "number" ? `${zar.format(Math.round(n))} km` : "";

export const formatNumber = (n: number): string => zar.format(n);

export const formatDate = (value?: string | Date | null): string => {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });
};

/**
 * Flat monthly instalment estimate (amortised) for the finance calculator.
 * Not a quote, display with the "estimate only" disclaimer.
 */
export const monthlyInstalment = (
  principal: number,
  annualRatePct: number,
  months: number,
): number => {
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
};

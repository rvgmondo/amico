import Link from "next/link";

/**
 * Phase 1 placeholder home page — proves the frontend route group renders and
 * that the CMS admin is reachable. Replaced by the real, designed homepage in
 * Phase 4 (hero, featured inventory, finance/trade-in teasers, testimonials).
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-24">
      <div className="flex flex-col gap-4">
        <span
          className="text-sm font-semibold uppercase tracking-widest"
          style={{ color: "#c39a00", fontFamily: "var(--font-display)" }}
        >
          SA Multi Franchise Group
        </span>
        <h1
          className="text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Amico Motors
        </h1>
        <p className="max-w-prose text-lg text-neutral-600">
          Quality used cars in Gezina, Pretoria — with easy bank finance and honest,
          friendly service. The full site is under construction.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/admin"
          className="inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#181c74" }}
        >
          Open the admin portal
        </Link>
        <a
          href="tel:+27123351640"
          className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 px-6 text-sm font-semibold transition-colors hover:bg-neutral-50"
        >
          (012) 335-1640
        </a>
      </div>

      <p className="text-sm text-neutral-500">
        505 Swemmer Street, Gezina, Pretoria · Mon–Fri 8:00–17:00 · Sat 8:00–13:00
      </p>
    </main>
  );
}

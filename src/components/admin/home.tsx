import type { DashboardViewServerProps } from "@payloadcms/next/views";
import { Gutter, Link } from "@payloadcms/ui";

import type { Enquiry, Vehicle } from "@/payload-types";

/**
 * The admin home screen (`admin.components.views.dashboard`), replacing Payload's grid of
 * collection names. Adapted from the Verboten and Rynet admins, written in Afrikaans for the
 * dealership.
 *
 * It answers the morning question first: who is waiting for a reply. Then the cars that are not
 * ready to sell, because a car without mileage, a price, a year or a photo is held back on Rynet
 * and harder to find on the website. Every number is counted fresh and links to the thing itself,
 * and a panel only appears when there is something in it. The email warning appears only when
 * the server has no mail settings, because then nobody hears about a new enquiry.
 */

const rand = (n: number) => `R${Math.round(n).toLocaleString("en-ZA").replace(/[,\s ]/g, " ")}`;

const longDate = (d: Date) =>
  d.toLocaleDateString("af-ZA", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Johannesburg" });

const greeting = (d: Date) => {
  const h = Number(d.toLocaleString("en-ZA", { hour: "2-digit", hour12: false, timeZone: "Africa/Johannesburg" }));
  return h < 12 ? "Goeiemôre" : h < 18 ? "Goeiemiddag" : "Goeienaand";
};

const ago = (iso: string, now: Date) => {
  const mins = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min gelede`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} uur gelede`;
  const days = Math.round(hours / 24);
  return days === 1 ? "gister" : `${days} dae gelede`;
};

const ENQUIRY_TYPES: Record<string, string> = {
  general: "Algemene navraag",
  vehicle: "Vra oor 'n kar",
  "test-drive": "Wil toetsry",
  finance: "Finansiering",
  "trade-in": "Inruil",
  contact: "Kontakvorm",
};

/** What Rynet holds a car back without, and what the website's filters need. */
const blockers = (v: Vehicle): string[] => {
  const gaps: string[] = [];
  if (typeof v.mileage !== "number") gaps.push("kilometers");
  if (!v.price) gaps.push("prys");
  if (!v.year) gaps.push("jaar");
  if (!v.images || v.images.length === 0) gaps.push("foto's");
  return gaps;
};
const specGaps = (v: Vehicle): string[] => {
  const gaps: string[] = [];
  if (!v.bodyType) gaps.push("bakstyl");
  if (!v.fuelType) gaps.push("brandstof");
  if (!v.transmission) gaps.push("ratkas");
  return gaps;
};

const Panel = ({
  title,
  tone,
  action,
  children,
}: {
  title: string;
  tone?: "warn" | "quiet";
  action?: { href: string; label: string };
  children: React.ReactNode;
}) => (
  <section className={`am-admin-card${tone ? ` am-admin-card--${tone}` : ""}`}>
    <header className="am-admin-card__head">
      <h2 className="am-admin-card__title">{title}</h2>
      {action && (
        <Link className="am-admin-card__action" href={action.href} prefetch={false}>
          {action.label}
        </Link>
      )}
    </header>
    {children}
  </section>
);

const Stat = ({ value, label, href, tone }: { value: string; label: string; href: string; tone?: "warn" }) => (
  <li className={`am-admin-stat${tone ? ` am-admin-stat--${tone}` : ""}`}>
    <Link className="am-admin-stat__link" href={href} prefetch={false}>
      <span className="am-admin-stat__value">{value}</span>
      <span className="am-admin-stat__label">{label}</span>
    </Link>
  </li>
);

export async function AdminHome(props: DashboardViewServerProps) {
  const { payload, user } = props;
  const admin = payload.config.routes.admin;
  const now = new Date();
  const carsUrl = `${admin}/collections/vehicles`;
  const enquiriesUrl = `${admin}/collections/enquiries`;

  const [forSale, newEnquiries, recent] = await Promise.all([
    payload.find({
      collection: "vehicles",
      where: { status: { not_equals: "sold" } },
      limit: 1000,
      pagination: false,
      depth: 0,
      overrideAccess: true,
      sort: "-createdAt",
    }),
    payload.find({
      collection: "enquiries",
      where: { status: { equals: "new" } },
      limit: 8,
      depth: 1,
      overrideAccess: true,
      sort: "-createdAt",
    }),
    payload.find({
      collection: "enquiries",
      where: { createdAt: { greater_than: new Date(now.getTime() - 7 * 86_400_000).toISOString() } },
      limit: 0,
      overrideAccess: true,
    }),
  ]);

  const cars = forSale.docs as Vehicle[];
  const value = cars.reduce((sum, v) => sum + (v.price ?? 0), 0);
  const held = cars.map((v) => ({ car: v, gaps: blockers(v) })).filter((r) => r.gaps.length > 0);
  const thin = cars.map((v) => ({ car: v, gaps: specGaps(v) })).filter((r) => r.gaps.length > 0 && blockers(r.car).length === 0);
  const latest = cars.slice(0, 5);

  const emailReady = Boolean(process.env.SMTP_HOST);
  // A shared login named after the business would read "Goeiemôre, Amico".
  const fullName = (user as { name?: string } | null)?.name ?? "";
  const firstName = /^(amico|admin)/i.test(fullName) ? "" : fullName.split(" ")[0];
  const quiet = newEnquiries.totalDocs === 0 && held.length === 0 && thin.length === 0;

  return (
    <Gutter className="am-admin-home">
      <header className="am-admin-home__head">
        <div>
          <p className="am-admin-home__date">{longDate(now)}</p>
          <h1 className="am-admin-home__title">
            {greeting(now)}
            {firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="am-admin-home__lead">
            {newEnquiries.totalDocs > 0
              ? `${newEnquiries.totalDocs} ${newEnquiries.totalDocs === 1 ? "navraag wag" : "navrae wag"} vir 'n antwoord. Begin daar.`
              : "Geen navrae wag nie."}
          </p>
        </div>
        <Link className="am-admin-home__add" href={`${carsUrl}/create`} prefetch={false}>
          + Laai 'n kar
        </Link>
      </header>

      {!emailReady && (
        <div className="am-admin-alert" role="alert">
          <strong>E-posse word nie gestuur nie.</strong> Die bediener het geen e-posinstellings nie, so
          nuwe navrae kom nie in jou inkassie nie. Hulle staan wel hier onder Enquiries.
        </div>
      )}

      <ul className="am-admin-stats">
        <Stat value={String(cars.length)} label="Karre te koop" href={carsUrl} />
        <Stat value={rand(value)} label="Waarde van die voorraad" href={carsUrl} />
        <Stat
          value={String(newEnquiries.totalDocs)}
          label="Nuwe navrae"
          href={`${enquiriesUrl}?where[status][equals]=new`}
          tone={newEnquiries.totalDocs ? "warn" : undefined}
        />
        <Stat value={String(recent.totalDocs)} label="Navrae, laaste 7 dae" href={enquiriesUrl} />
      </ul>

      <div className="am-admin-home__grid">
        {newEnquiries.totalDocs > 0 && (
          <Panel title="Navrae om te beantwoord" tone="warn" action={{ href: enquiriesUrl, label: "Alle navrae" }}>
            <ul className="am-admin-rows">
              {(newEnquiries.docs as Enquiry[]).map((e) => {
                const car = typeof e.vehicle === "object" && e.vehicle ? e.vehicle.title : null;
                return (
                  <li key={e.id} className="am-admin-row">
                    <Link href={`${enquiriesUrl}/${e.id}`} prefetch={false} className="am-admin-row__main">
                      <span className="am-admin-row__title">{e.name}</span>
                      <span className="am-admin-row__meta">
                        {ENQUIRY_TYPES[e.type] ?? "Navraag"}
                        {car ? `: ${car}` : ""}
                      </span>
                    </Link>
                    <span className="am-admin-badge">{ago(e.createdAt, now)}</span>
                  </li>
                );
              })}
            </ul>
            <p className="am-admin-card__note">Maak een oop, bel of WhatsApp die kliënt, en sit die status op Contacted.</p>
          </Panel>
        )}

        {held.length > 0 && (
          <Panel
            title={`${held.length} ${held.length === 1 ? "kar wys" : "karre wys"} nie op Rynet nie`}
            tone="warn"
            action={{ href: carsUrl, label: "Alle karre" }}
          >
            <ul className="am-admin-rows">
              {held.slice(0, 8).map(({ car, gaps }) => (
                <li key={car.id} className="am-admin-row">
                  <Link href={`${carsUrl}/${car.id}`} prefetch={false} className="am-admin-row__main">
                    <span className="am-admin-row__title">{car.title}</span>
                    <span className="am-admin-row__meta">Kort: {gaps.join(", ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="am-admin-card__note">Vul dit in en druk Save. Rynet wys hom met sy volgende lees, binne drie uur.</p>
          </Panel>
        )}

        {thin.length > 0 && (
          <Panel title={`${thin.length} ${thin.length === 1 ? "kar is" : "karre is"} moeiliker om te vind`}>
            <ul className="am-admin-rows">
              {thin.slice(0, 5).map(({ car, gaps }) => (
                <li key={car.id} className="am-admin-row">
                  <Link href={`${carsUrl}/${car.id}`} prefetch={false} className="am-admin-row__main">
                    <span className="am-admin-row__title">{car.title}</span>
                    <span className="am-admin-row__meta">Geen {gaps.join(" of ")} nie</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="am-admin-card__note">
              Kopers filter op bakstyl, brandstof en ratkas. Vul dit in by die Specs-oortjie
              {thin.length > 5 ? `; hier is die eerste 5 van ${thin.length}.` : "."}
            </p>
          </Panel>
        )}

        {latest.length > 0 && (
          <Panel title="Laaste karre gelaai" action={{ href: `${carsUrl}/create`, label: "+ Laai 'n kar" }}>
            <ul className="am-admin-rows">
              {latest.map((v) => (
                <li key={v.id} className="am-admin-row">
                  <Link href={`${carsUrl}/${v.id}`} prefetch={false} className="am-admin-row__main">
                    <span className="am-admin-row__title">{v.title}</span>
                    <span className="am-admin-row__meta">
                      {v.price ? rand(v.price) : "Geen prys"}
                      {typeof v.mileage === "number" ? `, ${v.mileage.toLocaleString("en-ZA").replace(/[,\s ]/g, " ")} km` : ""}
                    </span>
                  </Link>
                  <span className="am-admin-badge am-admin-badge--quiet">{ago(v.createdAt, now)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {quiet && (
          <Panel title="Alles reg" tone="quiet">
            <p className="am-admin-card__note">Elke navraag is beantwoord en elke kar het wat hy nodig het.</p>
          </Panel>
        )}
      </div>

      <nav className="am-admin-shortcuts" aria-label="Kortpaaie">
        <Link href={carsUrl} prefetch={false}>Alle karre</Link>
        <Link href={enquiriesUrl} prefetch={false}>Alle navrae</Link>
        <Link href={`${admin}/globals/site-settings`} prefetch={false}>Kontakbesonderhede en ure</Link>
        <Link href={`${admin}/collections/posts`} prefetch={false}>Nuus op die webblad</Link>
        <a href="/" target="_blank" rel="noopener noreferrer">Sien die webblad</a>
      </nav>
    </Gutter>
  );
}

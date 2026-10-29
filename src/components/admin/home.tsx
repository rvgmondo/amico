import type { DashboardViewServerProps } from "@payloadcms/next/views";
import { Gutter, Link } from "@payloadcms/ui";

import type { Enquiry, Vehicle } from "@/payload-types";

/**
 * The admin home screen (`admin.components.views.dashboard`), replacing Payload's grid of
 * collection names. Adapted from the Verboten and Rynet admins, in English and Afrikaans (the
 * EN | AF switch in the menu).
 *
 * It answers the morning question first: who is waiting for a reply. Then the cars that are not
 * ready to sell, because a car without mileage, a price, a year or a photo is held back on Rynet
 * and harder to find on the website. Every number is counted fresh and links to the thing itself,
 * and a panel only appears when there is something in it. The email warning appears only when
 * the server has no mail settings, because then nobody hears about a new enquiry.
 */

type Lang = "en" | "af";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const T = {
  en: {
    locale: "en-ZA",
    greet: (h: number): string => (h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"),
    waiting: (n: number) => `${plural(n, "enquiry is", "enquiries are")} waiting for a reply. Start there.`,
    noneWaiting: "No enquiries waiting.",
    add: "+ Add a car",
    emailTitle: "Emails are not being sent.",
    emailBody: "The server has no email settings, so new enquiries do not reach your inbox. They are still saved under Enquiries.",
    forSale: "Cars for sale",
    stockValue: "Stock value",
    newEnquiries: "New enquiries",
    lastWeek: "Enquiries, last 7 days",
    toAnswer: "Enquiries to answer",
    allEnquiries: "All enquiries",
    answerNote: "Open one, call or WhatsApp the buyer, then set its status to Contacted.",
    notOnRynet: (n: number) => `${plural(n, "car is", "cars are")} not showing on Rynet`,
    allCars: "All cars",
    missing: "Missing",
    heldNote: "Fill it in and save. Rynet shows the car on its next read, within three hours.",
    thin: (n: number) => `${plural(n, "car is", "cars are")} harder to find`,
    noSpec: (gaps: string[]) => `No ${gaps.join(" or ")}`,
    thinNote: (n: number) =>
      `Buyers filter on body type, fuel and gearbox. Fill them in on the Specs tab${n > 5 ? `; here are the first 5 of ${n}.` : "."}`,
    latest: "Latest cars added",
    noPrice: "No price",
    quietTitle: "All good",
    quietNote: "Every enquiry is answered and every car has what it needs.",
    shortcuts: "Shortcuts",
    contact: "Contact details and hours",
    news: "News on the website",
    site: "View the website",
    gaps: { mileage: "mileage", price: "price", year: "year", photos: "photos", body: "body type", fuel: "fuel", gearbox: "gearbox" },
    types: { general: "General enquiry", vehicle: "Asking about a car", "test-drive": "Wants a test drive", finance: "Finance", "trade-in": "Trade-in", contact: "Contact form" } as Record<string, string>,
    enquiry: "Enquiry",
    ago: (mins: number) => {
      if (mins < 60) return `${mins} min ago`;
      const h = Math.round(mins / 60);
      if (h < 24) return `${h} h ago`;
      const d = Math.round(h / 24);
      return d === 1 ? "yesterday" : `${d} days ago`;
    },
  },
  af: {
    locale: "af-ZA",
    greet: (h: number): string => (h < 12 ? "Goeiemôre" : h < 18 ? "Goeiemiddag" : "Goeienaand"),
    waiting: (n: number) => `${plural(n, "navraag wag", "navrae wag")} vir 'n antwoord. Begin daar.`,
    noneWaiting: "Geen navrae wag nie.",
    add: "+ Laai 'n kar",
    emailTitle: "E-posse word nie gestuur nie.",
    emailBody: "Die bediener het geen e-posinstellings nie, so nuwe navrae kom nie in jou inkassie nie. Hulle staan wel hier onder Navrae.",
    forSale: "Karre te koop",
    stockValue: "Waarde van die voorraad",
    newEnquiries: "Nuwe navrae",
    lastWeek: "Navrae, laaste 7 dae",
    toAnswer: "Navrae om te beantwoord",
    allEnquiries: "Alle navrae",
    answerNote: "Maak een oop, bel of WhatsApp die kliënt, en sit die status op Gekontak.",
    notOnRynet: (n: number) => `${plural(n, "kar wys", "karre wys")} nie op Rynet nie`,
    allCars: "Alle karre",
    missing: "Kort",
    heldNote: "Vul dit in en stoor. Rynet wys die kar met sy volgende lees, binne drie uur.",
    thin: (n: number) => `${plural(n, "kar is", "karre is")} moeiliker om te vind`,
    noSpec: (gaps: string[]) => `Geen ${gaps.join(" of ")} nie`,
    thinNote: (n: number) =>
      `Kopers filter op bakstyl, brandstof en ratkas. Vul dit in by die Specs-oortjie${n > 5 ? `; hier is die eerste 5 van ${n}.` : "."}`,
    latest: "Laaste karre gelaai",
    noPrice: "Geen prys",
    quietTitle: "Alles reg",
    quietNote: "Elke navraag is beantwoord en elke kar het wat hy nodig het.",
    shortcuts: "Kortpaaie",
    contact: "Kontakbesonderhede en ure",
    news: "Nuus op die webblad",
    site: "Sien die webblad",
    gaps: { mileage: "kilometers", price: "prys", year: "jaar", photos: "foto's", body: "bakstyl", fuel: "brandstof", gearbox: "ratkas" },
    types: { general: "Algemene navraag", vehicle: "Vra oor 'n kar", "test-drive": "Wil toetsry", finance: "Finansiering", "trade-in": "Inruil", contact: "Kontakvorm" } as Record<string, string>,
    enquiry: "Navraag",
    ago: (mins: number) => {
      if (mins < 60) return `${mins} min gelede`;
      const h = Math.round(mins / 60);
      if (h < 24) return `${h} uur gelede`;
      const d = Math.round(h / 24);
      return d === 1 ? "gister" : `${d} dae gelede`;
    },
  },
};

type Words = (typeof T)["en"];

const rand = (n: number) => `R${Math.round(n).toLocaleString("en-ZA").replace(/[,\s ]/g, " ")}`;
const km = (n: number) => `${n.toLocaleString("en-ZA").replace(/[,\s ]/g, " ")} km`;
const hourInSA = (d: Date) =>
  Number(d.toLocaleString("en-ZA", { hour: "2-digit", hour12: false, timeZone: "Africa/Johannesburg" }));
const minutesSince = (iso: string, now: Date) => Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));

/** What Rynet holds a car back without. */
const blockers = (v: Vehicle, w: Words): string[] => {
  const gaps: string[] = [];
  if (typeof v.mileage !== "number") gaps.push(w.gaps.mileage);
  if (!v.price) gaps.push(w.gaps.price);
  if (!v.year) gaps.push(w.gaps.year);
  if (!v.images || v.images.length === 0) gaps.push(w.gaps.photos);
  return gaps;
};
/** What the website's filters need. */
const specGaps = (v: Vehicle, w: Words): string[] => {
  const gaps: string[] = [];
  if (!v.bodyType) gaps.push(w.gaps.body);
  if (!v.fuelType) gaps.push(w.gaps.fuel);
  if (!v.transmission) gaps.push(w.gaps.gearbox);
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
  const { payload, user, i18n } = props;
  const lang: Lang = i18n?.language === "af" ? "af" : "en";
  const w = T[lang];
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
  const held = cars.map((v) => ({ car: v, gaps: blockers(v, w) })).filter((r) => r.gaps.length > 0);
  const thin = cars
    .map((v) => ({ car: v, gaps: specGaps(v, w) }))
    .filter((r) => r.gaps.length > 0 && blockers(r.car, w).length === 0);
  const latest = cars.slice(0, 5);

  const emailReady = Boolean(process.env.SMTP_HOST);
  // A shared login named after the business would read "Goeiemôre, Amico".
  const fullName = (user as { name?: string } | null)?.name ?? "";
  const firstName = /^(amico|admin)/i.test(fullName) ? "" : fullName.split(" ")[0];
  const quiet = newEnquiries.totalDocs === 0 && held.length === 0 && thin.length === 0;
  const date = now.toLocaleDateString(w.locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Africa/Johannesburg",
  });

  return (
    <Gutter className="am-admin-home">
      <header className="am-admin-home__head">
        <div>
          <p className="am-admin-home__date">{date}</p>
          <h1 className="am-admin-home__title">
            {w.greet(hourInSA(now))}
            {firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="am-admin-home__lead">
            {newEnquiries.totalDocs > 0 ? w.waiting(newEnquiries.totalDocs) : w.noneWaiting}
          </p>
        </div>
        <Link className="am-admin-home__add" href={`${carsUrl}/create`} prefetch={false}>
          {w.add}
        </Link>
      </header>

      {!emailReady && (
        <div className="am-admin-alert" role="alert">
          <strong>{w.emailTitle}</strong> {w.emailBody}
        </div>
      )}

      <ul className="am-admin-stats">
        <Stat value={String(cars.length)} label={w.forSale} href={carsUrl} />
        <Stat value={rand(value)} label={w.stockValue} href={carsUrl} />
        <Stat
          value={String(newEnquiries.totalDocs)}
          label={w.newEnquiries}
          href={`${enquiriesUrl}?where[status][equals]=new`}
          tone={newEnquiries.totalDocs ? "warn" : undefined}
        />
        <Stat value={String(recent.totalDocs)} label={w.lastWeek} href={enquiriesUrl} />
      </ul>

      <div className="am-admin-home__grid">
        {newEnquiries.totalDocs > 0 && (
          <Panel title={w.toAnswer} tone="warn" action={{ href: enquiriesUrl, label: w.allEnquiries }}>
            <ul className="am-admin-rows">
              {(newEnquiries.docs as Enquiry[]).map((e) => {
                const car = typeof e.vehicle === "object" && e.vehicle ? e.vehicle.title : null;
                return (
                  <li key={e.id} className="am-admin-row">
                    <Link href={`${enquiriesUrl}/${e.id}`} prefetch={false} className="am-admin-row__main">
                      <span className="am-admin-row__title">{e.name}</span>
                      <span className="am-admin-row__meta">
                        {w.types[e.type] ?? w.enquiry}
                        {car ? `: ${car}` : ""}
                      </span>
                    </Link>
                    <span className="am-admin-badge">{w.ago(minutesSince(e.createdAt, now))}</span>
                  </li>
                );
              })}
            </ul>
            <p className="am-admin-card__note">{w.answerNote}</p>
          </Panel>
        )}

        {held.length > 0 && (
          <Panel title={w.notOnRynet(held.length)} tone="warn" action={{ href: carsUrl, label: w.allCars }}>
            <ul className="am-admin-rows">
              {held.slice(0, 8).map(({ car, gaps }) => (
                <li key={car.id} className="am-admin-row">
                  <Link href={`${carsUrl}/${car.id}`} prefetch={false} className="am-admin-row__main">
                    <span className="am-admin-row__title">{car.title}</span>
                    <span className="am-admin-row__meta">
                      {w.missing}: {gaps.join(", ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="am-admin-card__note">{w.heldNote}</p>
          </Panel>
        )}

        {thin.length > 0 && (
          <Panel title={w.thin(thin.length)}>
            <ul className="am-admin-rows">
              {thin.slice(0, 5).map(({ car, gaps }) => (
                <li key={car.id} className="am-admin-row">
                  <Link href={`${carsUrl}/${car.id}`} prefetch={false} className="am-admin-row__main">
                    <span className="am-admin-row__title">{car.title}</span>
                    <span className="am-admin-row__meta">{w.noSpec(gaps)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="am-admin-card__note">{w.thinNote(thin.length)}</p>
          </Panel>
        )}

        {latest.length > 0 && (
          <Panel title={w.latest} action={{ href: `${carsUrl}/create`, label: w.add }}>
            <ul className="am-admin-rows">
              {latest.map((v) => (
                <li key={v.id} className="am-admin-row">
                  <Link href={`${carsUrl}/${v.id}`} prefetch={false} className="am-admin-row__main">
                    <span className="am-admin-row__title">{v.title}</span>
                    <span className="am-admin-row__meta">
                      {v.price ? rand(v.price) : w.noPrice}
                      {typeof v.mileage === "number" ? `, ${km(v.mileage)}` : ""}
                    </span>
                  </Link>
                  <span className="am-admin-badge am-admin-badge--quiet">{w.ago(minutesSince(v.createdAt, now))}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {quiet && (
          <Panel title={w.quietTitle} tone="quiet">
            <p className="am-admin-card__note">{w.quietNote}</p>
          </Panel>
        )}
      </div>

      <nav className="am-admin-shortcuts" aria-label={w.shortcuts}>
        <Link href={carsUrl} prefetch={false}>{w.allCars}</Link>
        <Link href={enquiriesUrl} prefetch={false}>{w.allEnquiries}</Link>
        <Link href={`${admin}/globals/site-settings`} prefetch={false}>{w.contact}</Link>
        <Link href={`${admin}/collections/posts`} prefetch={false}>{w.news}</Link>
        <a href="/" target="_blank" rel="noopener noreferrer">{w.site}</a>
      </nav>
    </Gutter>
  );
}

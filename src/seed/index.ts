import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPayload } from "payload";
import type { Payload } from "payload";

import config from "../payload.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const MAX_IMAGES = Number(process.env.SEED_MAX_IMAGES ?? 8);
const LIMIT = process.env.SEED_LIMIT ? Number(process.env.SEED_LIMIT) : Infinity;
// Optional local image cache (avoids re-downloading / rate limits). Point at a
// folder of previously-downloaded originals, keyed by the source URL's filename.
const IMAGE_CACHE = process.env.SEED_IMAGE_CACHE;

type HarvestedVehicle = {
  slug: string;
  sourceUrl: string;
  fullTitle: string;
  modelTitle: string;
  price: number;
  year: number | null;
  mileageKm: number | null;
  body: string | null;
  fuelType: string | null;
  transmission: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  engineRaw: string | null;
  description: string;
  primaryImage: string | null;
  images: string[];
};

// --- Make detection (slug prefix -> canonical name + display aliases to strip) ---
const MAKES: { prefix: string; name: string; aliases: string[] }[] = [
  { prefix: "mercedes-benz", name: "Mercedes-Benz", aliases: ["Mercedes-Benz", "Mercedes"] },
  { prefix: "land-rover", name: "Land Rover", aliases: ["Land Rover"] },
  { prefix: "volkswagen", name: "Volkswagen", aliases: ["Volkswagen", "VW"] },
  { prefix: "vw", name: "Volkswagen", aliases: ["VW", "Volkswagen"] },
  { prefix: "ford", name: "Ford", aliases: ["Ford"] },
  { prefix: "toyota", name: "Toyota", aliases: ["Toyota"] },
  { prefix: "bmw", name: "BMW", aliases: ["BMW"] },
  { prefix: "audi", name: "Audi", aliases: ["Audi"] },
  { prefix: "hyundai", name: "Hyundai", aliases: ["Hyundai"] },
  { prefix: "kia", name: "Kia", aliases: ["Kia"] },
  { prefix: "mazda", name: "Mazda", aliases: ["Mazda"] },
  { prefix: "nissan", name: "Nissan", aliases: ["Nissan"] },
  { prefix: "honda", name: "Honda", aliases: ["Honda"] },
  { prefix: "mini", name: "Mini", aliases: ["Mini"] },
  { prefix: "isuzu", name: "Isuzu", aliases: ["Isuzu"] },
  { prefix: "mahindra", name: "Mahindra", aliases: ["Mahindra"] },
  { prefix: "mitsubishi", name: "Mitsubishi", aliases: ["Mitsubishi"] },
  { prefix: "chevrolet", name: "Chevrolet", aliases: ["Chevrolet"] },
  { prefix: "opel", name: "Opel", aliases: ["Opel"] },
  { prefix: "suzuki", name: "Suzuki", aliases: ["Suzuki"] },
  { prefix: "jeep", name: "Jeep", aliases: ["Jeep"] },
  { prefix: "haval", name: "Haval", aliases: ["Haval"] },
  { prefix: "renault", name: "Renault", aliases: ["Renault"] },
  { prefix: "jaguar", name: "Jaguar", aliases: ["Jaguar"] },
].sort((a, b) => b.prefix.length - a.prefix.length);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function detectMake(slug: string) {
  return MAKES.find((m) => slug === m.prefix || slug.startsWith(m.prefix + "-")) ?? null;
}

function deriveModel(modelTitle: string, make: { name: string; aliases: string[] } | null): string {
  let s = modelTitle;
  if (make) {
    for (const alias of make.aliases) {
      s = s.replace(new RegExp("^" + escapeRe(alias) + "\\s+", "i"), "");
    }
  }
  s = s.replace(/\s*\b(19|20)\d{2}\b\s*$/, "").trim();
  // Keep the model name, dropping a trailing variant/engine descriptor
  // (e.g. "Spark 1.2 LS" -> "Spark", but keep "3 Series", "Grand i10", "X-Trail").
  const words = s.split(/\s+/);
  const kept: string[] = [];
  for (const w of words) {
    // Stop once we hit a displacement/trim token, but always keep the first word.
    if (kept.length >= 1 && /^\d[.,]\d/.test(w)) break; // 1.2, 2.0d
    if (kept.length >= 1 && /^\d{3,4}(cc)?$/i.test(w)) break; // 1600
    kept.push(w);
    if (kept.length >= 3) break;
  }
  return kept.join(" ") || s || modelTitle;
}

const BODY_MAP: Record<string, string> = {
  suv: "suv",
  suvs: "suv",
  hatchback: "hatchback",
  hatchbacks: "hatchback",
  sedan: "sedan",
  sedans: "sedan",
  bakkie: "single-cab",
  bakkies: "single-cab",
  "single-cab": "single-cab",
  "double-cab": "double-cab",
  "double cab": "double-cab",
  coupe: "coupe",
  mpv: "mpv",
  wagon: "wagon",
};

function mapBody(body: string | null, slug: string): string | undefined {
  if (body) {
    const key = body.toLowerCase().trim();
    if (BODY_MAP[key]) return BODY_MAP[key];
  }
  // Infer from slug when the site didn't state a body type.
  if (/double-cab|d-max|d-cab/.test(slug)) return "double-cab";
  if (/single-cab|s-cab|super-cab|pick-up/.test(slug)) return "single-cab";
  if (/polo|golf|i10|i20|swift|corsa|spark|aveo|brio|jazz|up-|swift|yaris|etios|fiesta|a1|mini/.test(slug))
    return "hatchback";
  if (/jetta|accent|corolla|ballade|a3-|a4|c-200|c-250|e-200|jetta/.test(slug)) return "sedan";
  return undefined;
}

function mapFuel(fuel: string | null): string | undefined {
  if (!fuel) return undefined;
  const f = fuel.toLowerCase();
  if (f.includes("diesel")) return "diesel";
  if (f.includes("petrol")) return "petrol";
  if (f.includes("hybrid")) return "hybrid";
  if (f.includes("electric")) return "electric";
  return undefined;
}

function mapTransmission(trans: string | null, slug: string): string | undefined {
  const s = `${trans ?? ""} ${slug}`.toLowerCase();
  if (/\bmanual\b/.test(s)) return "manual";
  if (/auto|tronic|dsg|cvt|dct|steptronic|s-tronic/.test(s)) return "automatic";
  return undefined;
}

function deriveEngine(slug: string): string | undefined {
  const m = slug.match(/(\d)-(\d)(t)?/);
  if (m) return `${m[1]}.${m[2]}${m[3] ? "T" : ""}L`;
  return undefined;
}

function derivePower(slug: string): string | undefined {
  const m = slug.match(/(\d{2,3})-?kw/i);
  return m ? `${m[1]} kW` : undefined;
}

function deriveDrivetrain(slug: string): string | undefined {
  if (/4x4/.test(slug)) return "4x4";
  if (/4x2/.test(slug)) return "4x2";
  if (/4-?motion|4mot|quattro|xdrive|awd|4-mot/.test(slug)) return "awd";
  return undefined;
}

// Returns a Payload lexical editor state. Typed loosely for the seed script.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lexical(text: string): any {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const blocks = paragraphs.length ? paragraphs : [text.trim() || " "];
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: blocks.map((p) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        textFormat: 0,
        textStyle: "",
        children: [
          { type: "text", detail: 0, format: 0, mode: "normal", style: "", text: p, version: 1 },
        ],
      })),
    },
  };
}

async function downloadImage(url: string): Promise<{ data: Buffer; mimetype: string; name: string; size: number } | null> {
  const ext = (url.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const mimetype = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const name = url.split("/").pop()?.split("?")[0] || `image.${ext}`;

  // Prefer the local cache when available (no network).
  if (IMAGE_CACHE) {
    try {
      const data = await readFile(path.join(IMAGE_CACHE, name));
      return { data, mimetype, name, size: data.length };
    } catch {
      /* not cached — fall through to network */
    }
  }

  try {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 20000);
    const res = await fetch(url, { headers: { "user-agent": "AmicoSeed/1.0" }, signal: ac.signal });
    clearTimeout(to);
    if (!res.ok) return null;
    const data = Buffer.from(await res.arrayBuffer());
    return { data, mimetype, name, size: data.length };
  } catch {
    return null;
  }
}

// --- Reference data ---

const TESTIMONIALS = [
  { author: "Njabulo Maphalala", quote: "Excellent service.", rating: 5, year: 2022 },
  { author: "Michael Msiza", quote: "My dealer with everything.", rating: 5, year: 2020 },
  { author: "Coralie Nel", quote: "Bernard gave us excellent service and advice.", rating: 5, year: 2023 },
  {
    author: "Jabulane Vilakati",
    quote:
      "Even though it was my first time visiting that place and I am not residing there, they were very good to me.",
    rating: 5,
    year: 2021,
  },
  {
    author: "Alfred Mmutle",
    quote: "Excellent service delivery, friendly and dedicated team. Try it, you'll see it for yourself.",
    rating: 5,
    year: 2021,
  },
  { author: "Frances Bredenkamp", quote: "Friendly, Afrikaans service.", rating: 5, year: 2023 },
  {
    author: "Marike de Villiers",
    quote: "Great car deals and very, very good service. Would not go anywhere else.",
    rating: 5,
    year: 2019,
  },
  {
    author: "Chriselda Braun",
    quote:
      "Baie vriendelike en uiters hulpvaardige eienaars! Gawe, eerlike mense wat uit hulle pad sal gaan om vir jou die beste voertuig op te spoor!",
    location: "Afrikaans",
    rating: 5,
    year: 2022,
  },
  { author: "Tumelo Mokoena", quote: "Very professional service.", rating: 5, year: 2021 },
];

async function upsertGlobals(payload: Payload) {
  await payload.updateGlobal({
    slug: "site-settings",
    data: {
      dealershipName: "Amico Motors",
      legalName: "SA Multi Franchise Group",
      tagline: "Quality used cars in Pretoria, with honest, friendly service.",
      hideSoldVehicles: false,
      contact: {
        street: "505 Swemmer Street",
        suburb: "Gezina",
        city: "Pretoria",
        postalCode: "0084",
        email: "amelda@amicomotors.co.za",
        phones: [
          { label: "Dealership", number: "(012) 335-1640" },
          { label: "Amelda", number: "082 321 0455" },
          { label: "Sales", number: "083 653 7708" },
        ],
        whatsappNumber: "27823210455",
        whatsappMessage: "Hi Amelda, I would like to know more about your used vehicles.",
      },
      hours: [
        { day: "Monday", open: "08:00", close: "17:00" },
        { day: "Tuesday", open: "08:00", close: "17:00" },
        { day: "Wednesday", open: "08:00", close: "17:00" },
        { day: "Thursday", open: "08:00", close: "17:00" },
        { day: "Friday", open: "08:00", close: "16:00" },
        { day: "Saturday", open: "08:00", close: "13:00" },
        { day: "Sunday", open: "", close: "", closed: true },
      ],
      location: {
        mapEmbedUrl:
          "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3594.63!2d28.20331746995893!3d-25.7167439770751!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1ebfd8b374695d35%3A0xbc1cc5160bc09848!2s505%20Swemmer%20St%2C%20Gezina%2C%20Pretoria!5e0!3m2!1sen!2sza!4v1733081162186!5m2!1sen!2sza",
        latitude: -25.716744,
        longitude: 28.203317,
      },
      finance: {
        // PLACEHOLDER rate/term — confirm with the client before launch.
        defaultRate: 11.75,
        defaultTermMonths: 72,
        defaultDepositPercent: 10,
        disclaimer:
          "This is an estimate only, not a quote or an offer of finance. Actual terms depend on credit approval and the bank's rate.",
      },
    },
  });

  await payload.updateGlobal({
    slug: "navigation",
    data: {
      header: [
        { label: "Home", url: "/" },
        { label: "Our Vehicles", url: "/vehicles" },
        { label: "Sell Your Car", url: "/sell-your-car" },
        { label: "Finance", url: "/finance" },
        { label: "About", url: "/about" },
        { label: "Contact", url: "/contact" },
      ],
      headerCta: { label: "Browse stock", url: "/vehicles" },
      footerColumns: [
        {
          heading: "Explore",
          links: [
            { label: "Our Vehicles", url: "/vehicles" },
            { label: "Sell Your Car", url: "/sell-your-car" },
            { label: "Finance", url: "/finance" },
            { label: "About Us", url: "/about" },
          ],
        },
        {
          heading: "Company",
          links: [
            { label: "Contact", url: "/contact" },
            { label: "News", url: "/blog" },
            { label: "Privacy Policy", url: "/privacy" },
            { label: "Terms", url: "/terms" },
          ],
        },
      ],
    },
  });
}

async function ensureAdmin(payload: Payload) {
  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: "admin@amicomotors.co.za" } },
    limit: 1,
  });
  if (existing.docs.length) {
    const user = existing.docs[0] as { id: string | number; roles?: string[] };
    if (!user.roles?.includes("admin")) {
      await payload.update({ collection: "users", id: user.id, data: { roles: ["admin"] } });
      payload.logger.info("Promoted existing admin user to role: admin");
    }
  } else {
    await payload.create({
      collection: "users",
      data: {
        email: "admin@amicomotors.co.za",
        password: process.env.ADMIN_PASSWORD || "ChangeMe123!",
        name: "Amico Admin",
        roles: ["admin"],
      },
    });
    payload.logger.info("Created admin user (role: admin)");
  }
}

async function seedTestimonials(payload: Payload) {
  const existing = await payload.count({ collection: "testimonials" });
  if (existing.totalDocs > 0) {
    payload.logger.info(`Testimonials already seeded (${existing.totalDocs}); skipping.`);
    return;
  }
  for (const [i, t] of TESTIMONIALS.entries()) {
    await payload.create({
      collection: "testimonials",
      data: {
        author: t.author,
        quote: t.quote,
        location: (t as { location?: string }).location,
        rating: t.rating,
        date: `${t.year}-12-02T00:00:00.000Z`,
        featured: i < 6,
      },
    });
  }
  payload.logger.info(`Seeded ${TESTIMONIALS.length} testimonials.`);
}

async function seedPlaceholders(payload: Payload) {
  // Team — flagged placeholders until the client supplies real names/photos/bios.
  if ((await payload.count({ collection: "team" })).totalDocs === 0) {
    const team = [
      { name: "[Placeholder] Sales Consultant", role: "Sales", order: 1 },
      { name: "[Placeholder] Finance & Insurance", role: "Finance", order: 2 },
      { name: "[Placeholder] Dealer Principal", role: "Management", order: 3 },
    ];
    for (const m of team) {
      await payload.create({
        collection: "team",
        data: { ...m, bio: "[Placeholder bio — provide the real team member's details.]" },
      });
    }
    payload.logger.info("Seeded 3 placeholder team members (flagged).");
  }

  // Blog — one flagged placeholder post so the section renders.
  if ((await payload.count({ collection: "categories" })).totalDocs === 0) {
    const cat = await payload.create({ collection: "categories", data: { title: "News" } });
    await payload.create({
      collection: "posts",
      data: {
        title: "[Placeholder] Welcome to the new Amico Motors website",
        excerpt: "A placeholder news article. Replace with real dealership news.",
        author: "Amico Motors",
        category: cat.id,
        publishedDate: new Date().toISOString(),
        _status: "published",
        content: lexical(
          "This is placeholder news content.\n\nUse the admin to publish real updates: new stock arrivals, finance specials, and dealership news.",
        ),
      },
    });
    payload.logger.info("Seeded 1 placeholder blog post (flagged).");
  }

  // Pages — About uses the client's real positioning; others are light placeholders.
  const pages = [
    {
      title: "About Us",
      slug: "about",
      hero: {
        heading: "Find the right car, the honest way",
        subheading:
          "Amico Motors is an independent multi-brand used-car dealership in Gezina, Pretoria, part of the SA Multi Franchise Group.",
      },
      body:
        "At Amico Motors, your satisfaction is our priority. We take care of your individual needs with personal attention and excellent after-sales service.\n\nWe carry a fine selection of good-quality used vehicles to suit your needs and your pocket, and as an approved dealer with most major banks we make finance easy. Every vehicle is checked against the highest standards before it reaches our floor.",
    },
    {
      title: "Privacy Policy",
      slug: "privacy",
      body:
        "[Placeholder] Amico Motors processes personal information in line with the Protection of Personal Information Act (POPIA). Replace this with the client's approved POPIA privacy statement (see their existing POPIA compliance letter).",
    },
    {
      title: "Terms & Conditions",
      slug: "terms",
      body: "[Placeholder] Replace with the dealership's approved terms and conditions.",
    },
  ];
  for (const p of pages) {
    if ((await payload.find({ collection: "pages", where: { slug: { equals: p.slug } }, limit: 1 })).docs.length) continue;
    await payload.create({
      collection: "pages",
      data: {
        title: p.title,
        slug: p.slug,
        hero: p.hero,
        content: lexical(p.body),
        _status: "published",
      },
    });
  }
  payload.logger.info("Seeded pages (About + placeholders).");
}

async function seedVehicles(payload: Payload) {
  const raw = await readFile(path.resolve(dirname, "data", "vehicles.json"), "utf8");
  const vehicles = (JSON.parse(raw) as HarvestedVehicle[]).slice(0, LIMIT);

  // Feature the 8 most expensive vehicles.
  const featuredSlugs = new Set(
    [...vehicles].sort((a, b) => (b.price ?? 0) - (a.price ?? 0)).slice(0, 8).map((v) => v.slug),
  );

  const makeCache = new Map<string, string | number>();
  const modelCache = new Map<string, string | number>();

  const getMake = async (name: string) => {
    if (makeCache.has(name)) return makeCache.get(name)!;
    const found = await payload.find({ collection: "makes", where: { name: { equals: name } }, limit: 1 });
    const id = found.docs.length
      ? found.docs[0].id
      : (await payload.create({ collection: "makes", data: { name } })).id;
    makeCache.set(name, id);
    return id;
  };
  const getModel = async (name: string, makeId: string | number) => {
    const key = `${makeId}:${name}`;
    if (modelCache.has(key)) return modelCache.get(key)!;
    const found = await payload.find({
      collection: "models",
      where: { and: [{ name: { equals: name } }, { make: { equals: makeId } }] },
      limit: 1,
    });
    const id = found.docs.length
      ? found.docs[0].id
      : (await payload.create({ collection: "models", data: { name, make: makeId as number } })).id;
    modelCache.set(key, id);
    return id;
  };

  let created = 0;
  let skipped = 0;
  for (const v of vehicles) {
    const exists = await payload.find({ collection: "vehicles", where: { slug: { equals: v.slug } }, limit: 1 });
    if (exists.docs.length) {
      skipped++;
      continue;
    }

    const makeInfo = detectMake(v.slug);
    const makeName = makeInfo?.name ?? v.fullTitle.split(" ")[0];
    const makeId = await getMake(makeName);
    const modelName = deriveModel(v.modelTitle, makeInfo);
    const modelId = await getModel(modelName, makeId);

    // Upload up to MAX_IMAGES images.
    const imageIds: (string | number)[] = [];
    const urls = [v.primaryImage, ...v.images].filter(Boolean) as string[];
    const unique = [...new Set(urls)].slice(0, MAX_IMAGES);
    for (const url of unique) {
      const file = await downloadImage(url);
      if (!file) continue;
      try {
        const media = await payload.create({
          collection: "media",
          data: { alt: `${v.fullTitle} — photo` },
          file,
        });
        imageIds.push(media.id);
      } catch {
        /* skip a bad image, keep going */
      }
    }

    await payload.create({
      collection: "vehicles",
      data: {
        title: v.fullTitle,
        slug: v.slug,
        make: makeId,
        model: modelId,
        variant: undefined,
        price: v.price,
        year: v.year ?? undefined,
        mileage: v.mileageKm ?? undefined,
        bodyType: mapBody(v.body, v.slug),
        fuelType: mapFuel(v.fuelType),
        transmission: mapTransmission(v.transmission, v.slug),
        drivetrain: deriveDrivetrain(v.slug),
        engine: deriveEngine(v.slug),
        power: derivePower(v.slug),
        exteriorColour: v.exteriorColor ?? undefined,
        interiorColour: v.interiorColor ?? undefined,
        condition: "used",
        status: "available",
        featured: featuredSlugs.has(v.slug),
        images: imageIds,
        description: lexical(v.description || v.fullTitle),
        sourceUrl: v.sourceUrl,
      } as never,
    });
    created++;
    if (created % 10 === 0) payload.logger.info(`  ...seeded ${created} vehicles`);
  }
  payload.logger.info(`Vehicles: created ${created}, skipped ${skipped} (already existed).`);
}

async function run() {
  const payload = await getPayload({ config });
  payload.logger.info("Seeding Amico Motors data...");

  if (process.env.SEED_FRESH === "true") {
    for (const collection of ["vehicles", "models", "makes", "media"] as const) {
      await payload.delete({ collection, where: { id: { exists: true } } });
    }
    payload.logger.info("Wiped vehicles/models/makes/media (SEED_FRESH).");
  }

  await ensureAdmin(payload);
  await upsertGlobals(payload);
  await seedTestimonials(payload);
  await seedPlaceholders(payload);
  await seedVehicles(payload);

  payload.logger.info("Seed complete.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

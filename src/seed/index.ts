import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getPayload } from "payload";
import type { Payload } from "payload";

import config from "../payload.config";

import {
  deriveDrivetrain,
  deriveEngine,
  deriveModel,
  derivePower,
  detectMake,
  downloadImage,
  lexical,
  mapBody,
  mapFuel,
  mapTransmission,
  type HarvestedVehicle,
} from "./mapping";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const MAX_IMAGES = Number(process.env.SEED_MAX_IMAGES ?? 8);
const LIMIT = process.env.SEED_LIMIT ? Number(process.env.SEED_LIMIT) : Infinity;
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
        // Indicative finance-calculator rate/term (shown to buyers as an estimate only).
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

async function seedContent(payload: Payload) {
  // NOTE: we do NOT seed team members. Real names, photos and bios are added in
  // the admin; the About page omits the team section until real members exist.
  // (Fuller versions of the welcome post and legal pages, with headings/lists,
  // are applied by scripts/update-content.mjs and scripts/update-legal.mjs.)

  // Blog: a real welcome post so the News section has genuine content.
  if ((await payload.count({ collection: "categories" })).totalDocs === 0) {
    const cat = await payload.create({ collection: "categories", data: { title: "News" } });
    await payload.create({
      collection: "posts",
      data: {
        title: "Welcome to the new Amico Motors website",
        slug: "welcome-to-the-new-amico-motors-website",
        excerpt:
          "We have launched a brand new website to make finding your next quality used car in Pretoria easier than ever. Here is what you can do on it.",
        author: "Amico Motors",
        category: cat.id,
        publishedDate: new Date().toISOString(),
        _status: "published",
        content: lexical(
          "Welcome, and thank you for stopping by. We are excited to launch our new website, built to make finding your next car simple, quick and honest, the same way we like to do business in person.\n\nAmico Motors has been helping people across Pretoria drive away in quality used vehicles, backed by friendly advice and easy bank finance. Our new site brings all of that online, so you can browse, compare and enquire whenever it suits you.\n\nEvery vehicle on our floor is now on the website, with photos, prices and the key details, and you can filter by make, model, price and body type to find the right fit for you and your budget. Use our finance calculator to get an instant estimate of your monthly instalment, and tell us about a car you want to trade in so we can put its value towards your next one.\n\nWhen you are ready, send an enquiry, book a test drive, or message us on WhatsApp straight from any vehicle page. You are always welcome to visit us at 505 Swemmer Street, Gezina, Pretoria, or call us on (012) 335-1640. Welcome to Amico Motors.",
        ),
      },
    });
    payload.logger.info("Seeded the welcome blog post.");
  }

  // Pages: About, Privacy (POPIA) and Terms, all real content.
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
        "Amico Motors (trading as SA Multi Franchise Group) respects your privacy and protects your personal information. This policy explains what we collect, why, how we use and protect it, and your rights under the Protection of Personal Information Act, 2013 (POPIA).\n\nWe are a used vehicle dealership at 505 Swemmer Street, Gezina, Pretoria. For any privacy question, or to exercise your rights, contact us on (012) 335-1640 or amelda@amicomotors.co.za. Amico Motors is the responsible party for the personal information described here.\n\nWe collect the information you give us when you enquire about a vehicle, book a test drive, apply for finance, request a trade-in valuation, or contact us. This can include your name, contact details, the vehicle you are interested in, and, for finance applications, the information the bank requires such as your identity number and income details.\n\nWe use your information to respond to your enquiries, arrange finance applications with banks and registered credit providers, process trade-in valuations, communicate with you, send marketing where you have agreed to it, and meet our legal obligations. To arrange finance we share the information you provide with banks and registered credit providers. We do not sell your personal information.\n\nWe take reasonable steps to keep your information safe and keep it only as long as we need it or the law requires. Under POPIA you may ask what we hold about you, ask us to correct or delete it, object to processing, or withdraw consent, and you may complain to the Information Regulator (South Africa) at enquiries@inforegulator.org.za. To exercise any right, contact us on the details above. We may update this policy from time to time, and the latest version will always be on this page.",
    },
    {
      title: "Terms & Conditions",
      slug: "terms",
      body:
        "These terms apply to your use of the Amico Motors website and to dealings with Amico Motors (trading as SA Multi Franchise Group). By using this website you agree to them.\n\nWe are a used vehicle dealership and describe every vehicle as accurately as we can, but listings, specifications, prices and availability can change and may contain errors. A listing is an invitation to enquire, not a binding offer, so please confirm the details, condition and price of any vehicle with us before you buy. Prices are in South African Rand and may change without notice, and additional costs such as licensing and on-the-road fees may apply.\n\nAmico Motors helps you apply for finance through banks and registered credit providers. We are not the credit provider and do not approve finance. All finance is subject to the bank's approval, terms and rate, and any figure from our finance calculator is an estimate for guidance only, not a quote. Any trade-in figure given before we inspect the vehicle is an estimate that depends on a physical inspection.\n\nOur vehicles are pre-owned and sold based on their condition at the time of sale, so we encourage you to inspect a vehicle before you buy. Nothing in these terms takes away any right you have under the Consumer Protection Act. The content on this website belongs to Amico Motors or its licensors and may not be copied without our permission. To the extent the law allows, we are not liable for loss arising from your use of this website. These terms are governed by the laws of South Africa. Contact us at 505 Swemmer Street, Gezina, Pretoria, on (012) 335-1640 or amelda@amicomotors.co.za.",
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
  payload.logger.info("Seeded pages (About, Privacy, Terms).");
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
          data: { alt: `${v.fullTitle}, photo` },
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
  await seedContent(payload);
  await seedVehicles(payload);

  payload.logger.info("Seed complete.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

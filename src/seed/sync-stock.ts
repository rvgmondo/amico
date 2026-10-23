/**
 * Brings the site's stock in line with a fresh harvest of Amico's old website, over the REST API,
 * so it works against any copy of the site (local, staging, live) without touching its database file.
 *
 *   npm run harvest                         read the old site into src/seed/data/vehicles.json
 *   npm run sync:stock -- --dry-run         say what would change, change nothing
 *   npm run sync:stock                      do it
 *   npm run sync:stock -- --allow-large-removal
 *
 * Env: SITE (default staging), ADMIN_EMAIL, ADMIN_PASSWORD, SEED_MAX_IMAGES (default 12).
 *
 * New cars are added with their photos. Cars still listed get their price, mileage and year
 * brought up to date, and go back on sale if they had been marked sold. Cars no longer listed are
 * marked sold, never deleted. A run that would take more than half the cars off sale stops,
 * because that is far more likely to be a broken harvest than a sold-out yard.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

const SITE = (process.env.SITE || "https://amico.mondocare.co.za").replace(/\/$/, "");
const EMAIL = process.env.ADMIN_EMAIL || "admin@amicomotors.co.za";
const PASSWORD = process.env.ADMIN_PASSWORD || "ChangeMe123!";
const MAX_IMAGES = Number(process.env.SEED_MAX_IMAGES ?? 12);
const DRY = process.argv.includes("--dry-run");
const ALLOW_LARGE_REMOVAL = process.argv.includes("--allow-large-removal");
const FEATURED_COUNT = 8;

type Id = number | string;
type Existing = {
  id: Id;
  slug: string;
  title: string;
  status: string;
  price?: number | null;
  mileage?: number | null;
  year?: number | null;
  featured?: boolean | null;
};

let token = "";

async function api<T = unknown>(route: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `JWT ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const res = await fetch(`${SITE}${route}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${route} -> ${res.status} ${JSON.stringify(body).slice(0, 300)}`);
  return body as T;
}

const qs = (where: Record<string, unknown>) =>
  new URLSearchParams(
    Object.entries(where).map(([k, v]) => [k, String(v)]),
  ).toString();

const makeCache = new Map<string, Id>();
const modelCache = new Map<string, Id>();

async function getMake(name: string): Promise<Id> {
  if (makeCache.has(name)) return makeCache.get(name)!;
  const found = await api<{ docs: { id: Id }[] }>(`/api/makes?${qs({ "where[name][equals]": name, limit: 1 })}`);
  const id = found.docs[0]?.id ?? (await api<{ doc: { id: Id } }>("/api/makes", { method: "POST", body: JSON.stringify({ name }) })).doc.id;
  makeCache.set(name, id);
  return id;
}

async function getModel(name: string, makeId: Id): Promise<Id> {
  const key = `${makeId}:${name}`;
  if (modelCache.has(key)) return modelCache.get(key)!;
  const found = await api<{ docs: { id: Id }[] }>(
    `/api/models?${qs({ "where[and][0][name][equals]": name, "where[and][1][make][equals]": makeId, limit: 1 })}`,
  );
  const id =
    found.docs[0]?.id ??
    (await api<{ doc: { id: Id } }>("/api/models", { method: "POST", body: JSON.stringify({ name, make: makeId }) })).doc.id;
  modelCache.set(key, id);
  return id;
}

async function uploadPhotos(v: HarvestedVehicle): Promise<Id[]> {
  const ids: Id[] = [];
  const urls = [...new Set([v.primaryImage, ...v.images].filter(Boolean) as string[])].slice(0, MAX_IMAGES);
  for (const url of urls) {
    const file = await downloadImage(url);
    if (!file) continue;
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(file.data)], { type: file.mimetype }), file.name);
    form.append("_payload", JSON.stringify({ alt: `${v.fullTitle}, photo` }));
    try {
      ids.push((await api<{ doc: { id: Id } }>("/api/media", { method: "POST", body: form })).doc.id);
    } catch (err) {
      console.warn(`  photo skipped (${url}): ${String(err).slice(0, 120)}`);
    }
  }
  return ids;
}

async function run() {
  const harvested = JSON.parse(
    await readFile(path.resolve(dirname, "data", "vehicles.json"), "utf8"),
  ) as HarvestedVehicle[];
  if (!harvested.length) throw new Error("The harvest is empty. Run `npm run harvest` first.");

  const login = await api<{ token?: string }>("/api/users/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!login.token) throw new Error("Login failed.");
  token = login.token;

  const current = (
    await api<{ docs: Existing[] }>(`/api/vehicles?${qs({ limit: 1000, depth: 0, pagination: "false" })}`)
  ).docs;
  const bySlug = new Map(current.map((v) => [v.slug, v]));
  const listed = new Set(harvested.map((v) => v.slug));

  const toAdd = harvested.filter((v) => !bySlug.has(v.slug));
  const toSell = current.filter((v) => v.status !== "sold" && !listed.has(v.slug));
  const onSale = current.filter((v) => v.status !== "sold").length;

  // The 8 dearest listed cars are featured, as in the seed.
  const featured = new Set(
    [...harvested].sort((a, b) => (b.price ?? 0) - (a.price ?? 0)).slice(0, FEATURED_COUNT).map((v) => v.slug),
  );

  const toUpdate: { v: Existing; patch: Record<string, unknown>; why: string[] }[] = [];
  for (const h of harvested) {
    const v = bySlug.get(h.slug);
    if (!v) continue;
    const patch: Record<string, unknown> = {};
    const why: string[] = [];
    if (h.price && h.price !== v.price) (patch.price = h.price), why.push(`price ${v.price} -> ${h.price}`);
    if (h.mileageKm != null && h.mileageKm !== v.mileage)
      (patch.mileage = h.mileageKm), why.push(`mileage ${v.mileage} -> ${h.mileageKm}`);
    if (h.year && h.year !== v.year) (patch.year = h.year), why.push(`year ${v.year} -> ${h.year}`);
    if (v.status === "sold") (patch.status = "available"), why.push("back on sale");
    if (Boolean(v.featured) !== featured.has(h.slug)) patch.featured = featured.has(h.slug);
    if (Object.keys(patch).length) toUpdate.push({ v, patch, why });
  }
  for (const v of toSell) if (v.featured) toUpdate.push({ v, patch: { featured: false }, why: [] });

  console.log(`${SITE}: ${harvested.length} cars on the old site, ${onSale} on sale here.`);
  console.log(`  add ${toAdd.length}, mark sold ${toSell.length}, update ${toUpdate.filter((u) => u.why.length).length}`);
  for (const v of toAdd) console.log(`  + ${v.slug}`);
  for (const v of toSell) console.log(`  - ${v.slug}`);
  for (const u of toUpdate) if (u.why.length) console.log(`  ~ ${u.v.slug}: ${u.why.join(", ")}`);

  if (onSale > 0 && toSell.length > onSale / 2 && !ALLOW_LARGE_REMOVAL) {
    console.error(
      `\nStopped: this would mark ${toSell.length} of ${onSale} cars sold, more than half at once. ` +
        "Check the harvest, and if it is right run again with --allow-large-removal.",
    );
    process.exit(1);
  }
  if (DRY) {
    console.log("\nDry run, nothing changed.");
    return;
  }

  for (const v of toSell) await api(`/api/vehicles/${v.id}`, { method: "PATCH", body: JSON.stringify({ status: "sold" }) });
  for (const u of toUpdate) await api(`/api/vehicles/${u.v.id}`, { method: "PATCH", body: JSON.stringify(u.patch) });

  let added = 0;
  for (const v of toAdd) {
    const makeInfo = detectMake(v.slug);
    const makeId = await getMake(makeInfo?.name ?? v.fullTitle.split(" ")[0]);
    const modelId = await getModel(deriveModel(v.modelTitle, makeInfo), makeId);
    const images = await uploadPhotos(v);
    await api("/api/vehicles", {
      method: "POST",
      body: JSON.stringify({
        title: v.fullTitle,
        slug: v.slug,
        make: makeId,
        model: modelId,
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
        featured: featured.has(v.slug),
        images,
        description: lexical(v.description || v.fullTitle),
        sourceUrl: v.sourceUrl,
      }),
    });
    added++;
    console.log(`  added ${added}/${toAdd.length}: ${v.slug} (${images.length} photos)`);
  }
  console.log(`\nDone: added ${added}, marked sold ${toSell.length}, updated ${toUpdate.length}.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

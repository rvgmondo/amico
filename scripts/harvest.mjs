// Harvest Amico Motors' live inventory into a seed fixture.
//
//   node scripts/harvest.mjs   (or: npm run harvest)
//
// Fetches every /listings/ page from the current WordPress site and writes a
// structured snapshot to src/seed/data/vehicles.json. Re-runnable; the seed
// script (Phase 2) consumes the JSON and downloads the referenced images.
import { load } from "cheerio";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src", "seed", "data", "vehicles.json");
const ORIGIN = "https://amicomotors.co.za";
const LIST_BASE = `${ORIGIN}/used-cars-pretoria/`;
const UA = "Mozilla/5.0 (compatible; AmicoRebuildHarvester/1.0)";

const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
const stripSize = (u) => u.replace(/-\d+x\d+(?=\.\w+$)/, "");

async function getHtml(url) {
  const res = await fetch(url, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

// Small concurrency pool.
async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch (err) {
        results[idx] = { slug: items[idx], error: String(err) };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

async function collectListingUrls() {
  const urls = new Set();
  // Probe pages until one yields no new listings (cap at 12 for safety).
  for (let page = 1; page <= 12; page++) {
    const url = page === 1 ? LIST_BASE : `${LIST_BASE}page/${page}/`;
    let html;
    try {
      html = await getHtml(url);
    } catch {
      break;
    }
    const $ = load(html);
    const before = urls.size;
    $('a[href*="/listings/"]').each((_, el) => {
      const href = ($(el).attr("href") || "").split("#")[0].split("?")[0];
      if (!href) return;
      const abs = href.startsWith("http") ? href : ORIGIN + href;
      urls.add(abs);
    });
    if (urls.size === before) break; // no new listings on this page
  }
  return [...urls];
}

function extract(html, url) {
  const $ = load(html);
  // Drop non-content nodes so gallery/init scripts don't leak into text extraction.
  // Keep JSON-LD (parsed below for the primary image).
  $('script:not([type="application/ld+json"]), style, noscript, template').remove();
  const slug = url.split("/listings/")[1].replace(/\/$/, "");

  let ldName = null;
  let primary = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const j = JSON.parse($(el).contents().text() || $(el).text());
      const nodes = j["@graph"] || [j];
      for (const n of nodes) {
        if (n["@type"] === "WebPage" && n.name && !ldName) ldName = n.name;
        if (n["@type"] === "ImageObject" && n.contentUrl && !primary) primary = n.contentUrl;
      }
    } catch {
      /* ignore malformed ld+json */
    }
  });

  const modelTitle = clean($("h1").first().text());

  let price = null;
  $("span,div,h3,strong,p").each((_, el) => {
    if (price) return;
    const m = clean($(el).text()).match(/^R\s?([\d][\d ]{3,})$/);
    if (m) price = parseInt(m[1].replace(/\s/g, ""), 10);
  });

  const labels = [
    "Exterior Color", "Interior Color", "Fuel type", "Body type", "Stock number",
    "Year", "Mileage", "Body", "Engine", "Transmission", "Drivetrain", "Doors",
    "Condition", "VIN", "Colour",
  ];
  const specs = {};
  $("li,div,td,tr,span,p,h6,h5").each((_, el) => {
    const t = clean($(el).text());
    if (t.length < 3 || t.length > 55) return;
    for (const lab of labels) {
      const re = new RegExp("^" + lab.replace(/ /g, "\\s*") + "\\s*[:\\-]?\\s*(\\S.+)$", "i");
      const m = t.match(re);
      if (m) {
        const k = lab.toLowerCase();
        if (!specs[k]) specs[k] = clean(m[1]);
        break;
      }
    }
  });

  // The Motors theme prints the prose under a "Vehicle overview" heading.
  let desc = "";
  const bodyText = clean($("body").text());
  const afterOverview = bodyText.split(/Vehicle overview/i)[1];
  if (afterOverview) {
    desc = afterOverview
      .split(
        /Additional information|Features\b|Related (?:listing|vehicle)|You may also|Similar listings|Contact us\b|Print page|Share this|Vehicle price|©/i,
      )[0]
      .trim();
  }
  if (desc.length < 40) {
    // Fallback: longest prose block that isn't the spec/wrapper noise.
    $("p,div").each((_, el) => {
      const t = clean($(el).text());
      if (
        t.length > 120 &&
        t.length < 1500 &&
        $(el).children().length <= 3 &&
        !/Mileage|Vehicle price|Print page|Share this|©|POPIA/i.test(t) &&
        t.length > desc.length
      ) {
        desc = t;
      }
    });
  }
  desc = desc.slice(0, 1200);

  const images = [
    ...new Set(
      $("img")
        .map((_, i) => $(i).attr("src") || "")
        .get()
        .filter((s) => /wp-content\/uploads\/20/.test(s) && !/logo/i.test(s))
        .map(stripSize),
    ),
  ].slice(0, 14);

  // Normalise a few fields.
  const yearFromSlug = (slug.match(/(?:^|-)(\d{4})(?:$|-)/) || [])[1];
  const year = specs.year ? parseInt(specs.year, 10) : yearFromSlug ? parseInt(yearFromSlug, 10) : null;
  const mileageKm = specs.mileage ? parseInt(specs.mileage.replace(/[^\d]/g, ""), 10) || null : null;

  return {
    slug,
    sourceUrl: url,
    fullTitle: ldName ? ldName.replace(/\s*[-–]\s*SA Multi.*$/i, "").trim() : modelTitle,
    modelTitle,
    price,
    year,
    mileageKm,
    body: specs.body || specs["body type"] || null,
    fuelType: specs["fuel type"] || null,
    transmission: specs.transmission || null,
    drivetrain: specs.drivetrain || null,
    exteriorColor: specs["exterior color"] || null,
    interiorColor: specs["interior color"] || null,
    engineRaw: specs.engine || null,
    doors: specs.doors || null,
    condition: specs.condition || "Used",
    description: desc.slice(0, 1200),
    primaryImage: primary ? stripSize(primary) : images[0] || null,
    images,
  };
}

async function main() {
  console.log("Collecting listing URLs ...");
  const urls = await collectListingUrls();
  console.log(`  found ${urls.length} listings`);

  console.log("Fetching listing pages ...");
  const raw = await mapPool(urls, 6, async (url) => extract(await getHtml(url), url));

  const seen = new Set();
  const vehicles = raw.filter((v) => v && v.slug && !v.error && !seen.has(v.slug) && seen.add(v.slug));
  const failed = raw.filter((v) => v && v.error);

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(vehicles, null, 2) + "\n", "utf8");

  const bodies = {};
  for (const v of vehicles) bodies[v.body || "unknown"] = (bodies[v.body || "unknown"] || 0) + 1;
  console.log(`\nWrote ${vehicles.length} vehicles -> ${path.relative(ROOT, OUT)}`);
  console.log("Body types:", bodies);
  console.log("Missing price:", vehicles.filter((v) => !v.price).length);
  console.log("Missing year:", vehicles.filter((v) => !v.year).length);
  console.log("Avg images:", (vehicles.reduce((a, v) => a + v.images.length, 0) / vehicles.length).toFixed(1));
  if (failed.length) console.log("Failed:", failed.map((f) => f.slug));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

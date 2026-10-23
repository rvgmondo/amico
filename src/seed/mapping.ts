import { readFile } from "node:fs/promises";
import path from "node:path";

// Shared by the seed and the stock sync: how a harvested listing maps onto a Vehicle.

// Optional local image cache (avoids re-downloading / rate limits). Point at a
// folder of previously-downloaded originals, keyed by the source URL's filename.
export const IMAGE_CACHE = process.env.SEED_IMAGE_CACHE;

export type HarvestedVehicle = {
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
export const MAKES: { prefix: string; name: string; aliases: string[] }[] = [
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

export const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function detectMake(slug: string) {
  return MAKES.find((m) => slug === m.prefix || slug.startsWith(m.prefix + "-")) ?? null;
}

export function deriveModel(modelTitle: string, make: { name: string; aliases: string[] } | null): string {
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

export const BODY_MAP: Record<string, string> = {
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

export function mapBody(body: string | null, slug: string): string | undefined {
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

export function mapFuel(fuel: string | null): string | undefined {
  if (!fuel) return undefined;
  const f = fuel.toLowerCase();
  if (f.includes("diesel")) return "diesel";
  if (f.includes("petrol")) return "petrol";
  if (f.includes("hybrid")) return "hybrid";
  if (f.includes("electric")) return "electric";
  return undefined;
}

export function mapTransmission(trans: string | null, slug: string): string | undefined {
  const s = `${trans ?? ""} ${slug}`.toLowerCase();
  if (/\bmanual\b/.test(s)) return "manual";
  if (/auto|tronic|dsg|cvt|dct|steptronic|s-tronic/.test(s)) return "automatic";
  return undefined;
}

export function deriveEngine(slug: string): string | undefined {
  const m = slug.match(/(\d)-(\d)(t)?/);
  if (m) return `${m[1]}.${m[2]}${m[3] ? "T" : ""}L`;
  return undefined;
}

export function derivePower(slug: string): string | undefined {
  const m = slug.match(/(\d{2,3})-?kw/i);
  return m ? `${m[1]} kW` : undefined;
}

export function deriveDrivetrain(slug: string): string | undefined {
  if (/4x4/.test(slug)) return "4x4";
  if (/4x2/.test(slug)) return "4x2";
  if (/4-?motion|4mot|quattro|xdrive|awd|4-mot/.test(slug)) return "awd";
  return undefined;
}

// Returns a Payload lexical editor state. Typed loosely for the seed script.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lexical(text: string): any {
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

export async function downloadImage(url: string): Promise<{ data: Buffer; mimetype: string; name: string; size: number } | null> {
  const ext = (url.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const mimetype = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  const name = url.split("/").pop()?.split("?")[0] || `image.${ext}`;

  // Prefer the local cache when available (no network).
  if (IMAGE_CACHE) {
    try {
      const data = await readFile(path.join(IMAGE_CACHE, name));
      return { data, mimetype, name, size: data.length };
    } catch {
      /* not cached, fall through to network */
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

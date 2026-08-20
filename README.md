# Amico Motors — Dealership Website

A production-grade website for **Amico Motors** (trading as SA Multi Franchise Group), an
independent multi-brand used-car dealership in Gezina, Pretoria. Built to generate qualified
leads (enquiries, test drives, finance, trade-ins) and let staff manage inventory and content
without a developer.

- **Public site:** browse inventory with faceted search, rich vehicle pages, finance calculator,
  and lead forms.
- **Admin portal:** a full CMS (Payload) for vehicles, media, blog, testimonials, team, pages,
  site settings, navigation, and captured leads.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15.4 (App Router, React 19, Server Components, TypeScript strict) |
| CMS / backend / auth | Payload CMS 3.88 (installed into the same Next app) |
| Database | PostgreSQL 17 (via Payload's Postgres adapter) |
| Styling | Tailwind CSS v4 (CSS-first design tokens) |
| UI | Radix primitives, custom brand-styled component library |
| Motion | Motion (Framer Motion) |
| Forms / validation | React Hook Form + Zod |

## Prerequisites

- **Node 20 or 22 LTS.** ⚠️ Node 24+/26 breaks Payload's config loader. This repo bundles a
  portable Node 22 at `vendor/node` (gitignored) for local dev — put it first on PATH.
- **PostgreSQL.** For local dev the repo uses a portable PostgreSQL 17 under `vendor/pgsql`
  (gitignored), managed by the scripts in `scripts/`. No system install needed.

On Windows PowerShell, prefix commands with the portable Node:

```powershell
$env:Path = "C:\CC\amico\vendor\node;$env:Path"
```

## Quick start

```powershell
# 1. Environment
Copy-Item .env.example .env   # then edit PAYLOAD_SECRET etc.

# 2. Install
npm install

# 3. Database (one-time): initialise + start portable Postgres, create the DB
npm run db:setup    # first run needs -BinariesSource; see scripts/db-setup.ps1

# 4. Seed: real inventory + testimonials + settings + flagged placeholders
npm run seed

# 5. Run
npm run dev         # http://localhost:3000  (admin at /admin)
```

The DB auto-starts before `npm run dev` (see the `predev` script).

## Environment variables

See `.env.example`. Key variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URI` | Postgres connection string (local portable, or Neon/Supabase in prod) |
| `PAYLOAD_SECRET` | Signs JWTs / encrypts data. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_SERVER_URL` | Public base URL (no trailing slash) |
| `SMTP_HOST/PORT/USER/PASS` | Lead-notification email. Leave `SMTP_HOST` blank in dev to log emails to the console |
| `EMAIL_FROM`, `LEADS_NOTIFY_TO` | From address and where new-lead emails are sent |

## Seeding

- `npm run harvest` — re-scrapes the current live site into `src/seed/data/vehicles.json`
  (a reproducible fixture; already committed).
- `npm run seed` — creates makes/models, vehicles (downloading photos into the media library),
  testimonials, site settings, navigation, the About page, and flagged placeholders.
  - `SEED_FRESH=true` wipes vehicles/makes/models/media first.
  - `SEED_MAX_IMAGES=8` caps images per vehicle. `SEED_LIMIT=5` limits vehicles (for quick dev).

## Admin & roles

- Dev login: `admin@amicomotors.co.za` / `ChangeMe123!` — **change before deploying.**
- Roles: **Admin** (full access, incl. users + settings) and **Editor** (content + inventory,
  no user management). Access control is enforced server-side at the collection and field level.
- A staff member can log in, add a vehicle with images, and it appears live — no code required.

## Project structure

```
src/
  payload.config.ts        # collections, globals, plugins, email, db adapter
  collections/             # Vehicles, Makes, Models, Testimonials, Team, Posts,
                           #   Categories, Pages, Enquiries, Media, Users
  globals/                 # SiteSettings, Navigation
  access/                  # role-based access helpers
  app/
    (frontend)/            # public site (its own root layout)
    (payload)/             # admin + REST/GraphQL (its own root layout)
    actions/enquiry.ts     # secure lead-submission server action
    sitemap.ts, robots.ts  # SEO
  components/              # ui/, layout/, home/, vehicles/, forms/
  lib/                    # payload data access, formatting, filters, favourites
  seed/                   # seed + admin scripts, vehicles.json fixture
scripts/                  # db-*.ps1, harvest.mjs
```

There is intentionally **no `src/app/layout.tsx`** — the app uses two root layouts (one per
route group). Media uploads are written to `media/` in local dev.

## Key scripts

| Script | Does |
|---|---|
| `npm run dev` / `build` / `start` | Next dev / production build / production server |
| `npm run db:start` / `db:stop` / `db:setup` | Manage portable Postgres |
| `npm run seed` / `seed:admin` | Seed data / create first admin |
| `npm run generate:types` / `generate:importmap` | Regenerate Payload types / admin import map |
| `npm run harvest` | Re-scrape live inventory into the seed fixture |
| `npm run lint` | ESLint |

## Deployment

The app is structured for **Vercel + managed Postgres (Neon or Supabase)**, and can also
self-host on a VPS.

1. Provision Postgres (Neon/Supabase) and set `DATABASE_URI` (with `?sslmode=require`).
2. Set `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, and SMTP variables.
3. Run migrations: Payload uses schema push in dev; for production generate and run migrations
   (`npm run payload migrate:create` / `migrate`).
4. **Media storage:** local disk is used in dev. On Vercel (ephemeral filesystem) add a Payload
   storage adapter — `@payloadcms/storage-vercel-blob` or `@payloadcms/storage-s3` (S3/R2) — so
   uploads persist. On a VPS with a persistent disk, the local adapter is fine.
5. Build: `npm run build`, start: `npm run start`.

## What's built in

- **SEO:** per-page metadata + canonicals, `AutoDealer`/`Vehicle`/`Article` JSON-LD, dynamic
  `sitemap.xml`, `robots.txt`, OpenGraph.
- **Security:** server-side role-based access control; lead API create locked to server actions
  (honeypot + rate limiting + Zod validation); CSP + HSTS + X-Content-Type-Options +
  Referrer-Policy + Permissions-Policy headers; secrets in env only.
- **Accessibility:** semantic HTML, keyboard-operable dialogs (focus trap/return), visible focus
  states, labelled forms with announced errors, skip link, `prefers-reduced-motion` respected.

## ⚠️ Placeholders to replace before launch (client content)

These are clearly flagged in the CMS / code and need real client input:

- **Team** members (names, roles, photos) — currently `[Placeholder]` entries.
- **Blog** — one placeholder post; replace with real news.
- **Finance rate/term** — Site Settings → Finance uses a placeholder default rate (11.75%).
  Confirm the real "finance from" rate and term with the client.
- **Privacy Policy & Terms** — placeholder copy; use the client's approved POPIA statement.
- **Photography** — vehicle photos are the client's current listing images. Higher-resolution
  studio/lot photography would lift the design further.

## Notes / hardening opportunities

- CSP currently allows `'unsafe-eval'` (required by the Payload admin bundle). A nonce-based CSP
  for the public routes is a future hardening step.
- Consider generating dynamic per-vehicle OpenGraph images.

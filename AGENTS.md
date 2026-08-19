# Amico Motors — Dealership Website

Production rebuild of https://amicomotors.co.za (Amico Motors, trading as SA Multi
Franchise Group) — an independent multi-brand **used**-car dealership in Gezina,
Pretoria. Goal: a fast, accessible, lead-generating site with a self-service CMS.

## Stack

- **Next.js 15.4.11** — App Router, React 19, Server Components, TypeScript strict.
- **Payload CMS 3.88** — installed into the same Next app (CMS + admin + auth + REST/GraphQL).
- **PostgreSQL 17.5** — portable, runs from the project (see below).
- **Tailwind CSS v4** — CSS-first tokens in `src/app/globals.css`.
- Motion, shadcn/ui, React Hook Form, Zod are added in later phases.

## ⚠️ Non-obvious environment rules (read before running anything)

1. **Use the project-local Node 22**, not the machine's Node. The repo pins a portable
   Node 22 LTS at `vendor/node`. Node 26 (the machine default) breaks Payload's config
   loader (`ERR_REQUIRE_ASYNC_MODULE` via `@payloadcms/richtext-lexical`). Put it first
   on PATH for every command:
   ```powershell
   $env:Path = "C:\CC\amico\vendor\node;$env:Path"
   ```
2. **`"type": "module"` is required** in package.json — Payload 3 is ESM-first; without
   it the config loader fails on top-level await.
3. **Portable Postgres** lives in the project: binaries in `vendor/pgsql`, cluster data in
   `.pgdata`, port **5433**. Both are gitignored. Managed by `scripts/db-*.ps1`.

## Running locally

```powershell
$env:Path = "C:\CC\amico\vendor\node;$env:Path"
npm run db:start   # start portable Postgres (also runs automatically before `dev`)
npm run dev        # Next + Payload on http://localhost:3000
```

- Public site: http://localhost:3000
- Admin portal: http://localhost:3000/admin — dev login `admin@amicomotors.co.za` / `ChangeMe123!` (change before deploying).
- Env lives in `.env` (gitignored); see `.env.example`.

Useful scripts: `db:setup` (one-time cluster init), `db:stop`, `generate:types`,
`generate:importmap`, `seed:admin`, `seed`, `harvest`.

## Structure

```
src/
  payload.config.ts        # Payload config (collections added per phase)
  payload-types.ts         # generated — do not edit by hand
  collections/             # Users, Media, (Vehicles, Makes, ... in Phase 2)
  app/
    (frontend)/            # public site — its own root layout (renders <html>)
    (payload)/             # admin + REST/GraphQL — its own root layout
  seed/                    # create-admin + seed scripts
scripts/                   # db-*.ps1, harvest.mjs
vendor/                    # portable node + postgres (gitignored)
```

There is intentionally **no `src/app/layout.tsx`** — the app uses two root layouts
(one per route group). Do not add a top-level layout.

## Build phases

1. ✅ Scaffold + running stack (Next+Payload+Postgres, admin, first user).
2. Data model: Vehicles, Makes, Models, BlogPosts, Testimonials, TeamMembers,
   Enquiries, Pages, roles & access control; seed real inventory.
3. Design system: brand tokens (gold/navy), typography, component library.
4. Public site & inventory (faceted search, detail pages).
5. Motion, accessibility (WCAG 2.2 AA), polish.
6. SEO, JSON-LD, sitemap, metadata, performance.
7. Forms, lead capture, notifications, security hardening.
8. QA, Lighthouse, README, deployment.

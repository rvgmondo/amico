# Deploying Amico Motors to cPanel

This is a Node app (Next.js + Payload CMS), so it runs through cPanel's
**Setup Node.js App** (Passenger), not `public_html`. It uses a **SQLite** database,
which is just a single file on the server. No database engine to set up, no restore.

Everything you need is in the `deploy/` folder on your PC (`C:\CC\amico\deploy\`):

| File | What it is |
|---|---|
| `amico-source.zip` | The app source (no node_modules / build). Extract into the app root. |
| `next-build.zip` | The **pre-built app** (`.next/`). Extract into the app root. Lets you SKIP `npm run build` — essential on low-process-limit hosts. |
| `amico.db` | The database: schema + all 97 seeded cars. Upload into the app root. |
| `media.zip` | The vehicle photos. Extract so they land in `media/`. |

> **Low process limit? (CloudLinux NPROC).** If `npm run build` fails with "unable to
> fork" / the process count hits 100%, DON'T build on the server. Upload `next-build.zip`
> (step 2), and in step 4 run **only** `npm install` — skip `npm run build` entirely.

---

## 1. Create the Node.js app  (cPanel → Setup Node.js App → Create Application)

- **Node version:** 20 or 22
- **Application mode:** Production
- **Application root:** `amico` (a folder in your home directory)
- **Application URL:** your domain or subdomain (e.g. `amicomotors.co.za`)
- **Application startup file:** `server.cjs`

Save. cPanel creates the app and a Node virtual environment. Keep this screen open.

## 2. Upload the files  (File Manager → into `~/amico`)

1. Upload **`amico-source.zip`** and **Extract** it into the app root (`~/amico`).
2. Upload **`amico.db`** into the app root (`~/amico/amico.db`).
3. Upload **`media.zip`** and **Extract** it so the photos land in `~/amico/media/`
   (after extraction you should have `~/amico/media/` full of `.jpg` files).

> The 290 MB `media.zip` may exceed File Manager's upload limit. If it does, send that
> one file over **FTP/SFTP** instead, then Extract it in File Manager.

## 3. Set environment variables  (on the Setup Node.js App screen)

⚠️ Set these **before** building — `NEXT_PUBLIC_SERVER_URL` is baked in at build time.

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PAYLOAD_SECRET` | a new long random string (see below) |
| `DATABASE_URI` | `file:./amico.db` |
| `NEXT_PUBLIC_SERVER_URL` | `https://yourdomain.co.za` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | (optional) for lead emails |
| `EMAIL_FROM` / `LEADS_NOTIFY_TO` | (optional) from address / where leads are emailed |

Generate a secret locally: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 4. Install + build

Copy the "Enter to the virtual environment" command from the Node App screen (or use
Terminal), then:
```
npm install --include=dev
npm run build
```
- Use `--include=dev` — because `NODE_ENV=production` is set, a plain `npm install`
  skips the build tools (Tailwind, TypeScript) and the build fails.
- `npm install` also compiles the correct Linux binaries (`sharp`, the SQLite client).
- `npm run build` produces the production build.

If `npm run build` is **killed** (shared-hosting memory limit), see Troubleshooting.

## 5. Start

On the Setup Node.js App screen, click **Restart**. Then visit:
- Public site: `https://yourdomain`
- Admin: `https://yourdomain/admin` — log in as `admin@amicomotors.co.za` /
  `ChangeMe123!` and **change the password immediately**.

---

## Updating later

Re-upload changed source, run `npm install` (only if deps changed) + `npm run build`,
then Restart. **Do not overwrite** `amico.db` or the `media/` folder when updating —
those hold your live data and photos.

## Troubleshooting

- **Build killed / out of memory:** shared hosting often caps RAM. Ask the host to
  raise the Node app's memory limit, or build locally (Linux/WSL) and upload the
  `.next` folder with the source — then just `npm install` on the server (no build).
- **502 / won't start:** check the app's stderr log (Node App screen → Logs, or
  `~/amico/stderr.log`). Usually a missing `PAYLOAD_SECRET` or the app can't write to
  `amico.db` (the app root must be writable — it is by default).
- **Images 404:** `media/` wasn't extracted into `~/amico/media/`. Re-extract `media.zip`.
- **"readonly database" errors:** make sure `amico.db` and the `~/amico` folder are
  owned by your cPanel user (they are, if you uploaded them there).

## Backups

Your entire site state is two things: **`amico.db`** and the **`media/`** folder.
Back up both together. That's the whole database and all photos.

## Note on the database choice

Payload supports Postgres, SQLite, and MongoDB (not MySQL/MariaDB). Your host's
PostgreSQL is version 10 (2017, end-of-life), which Payload 3 doesn't support, so we
use **SQLite** — a single file, fully supported, and a great fit for a single
dealership site. If you ever move to a managed Postgres (e.g. Neon), set
`DATABASE_URI` to that `postgresql://...` URL and the app switches automatically.

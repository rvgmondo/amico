# Deploying Amico Motors to cPanel

This is a Node app (Next.js + Payload CMS), not a PHP site, so it runs through
cPanel's **Setup Node.js App** (Passenger) rather than `public_html`. It uses
**PostgreSQL**. Plan: create the DB, restore the data, upload the app, install +
build, set env vars, start.

Everything you need is in the `deploy/` folder on your PC (`C:\CC\amico\deploy\`):

| File | What it is |
|---|---|
| `amico-db.sql` | The database: schema + all 97 seeded cars. Restore into your cPanel Postgres. |
| `media.zip` | The 290 MB media library (vehicle photos). Extract into the app's `media/` folder. |
| `amico-source.zip` | The app source (no node_modules / build). Extract into the app root. |

---

## 1. Create the PostgreSQL database  (cPanel → PostgreSQL Databases)

1. **Create database** named `amico` (cPanel prefixes it, e.g. `youruser_amico`).
2. **Create a user** with a strong password (e.g. `youruser_amico`).
3. **Add the user to the database** with **ALL PRIVILEGES**.
4. Your connection string will be:
   ```
   postgresql://youruser_amico:PASSWORD@localhost:5432/youruser_amico
   ```

## 2. Restore the data

**phpPgAdmin** (in the PostgreSQL section): open your `youruser_amico` database →
SQL / Import → upload `amico-db.sql` → run.

**or SSH/Terminal:**
```
psql -h localhost -U youruser_amico youruser_amico < amico-db.sql
```
Check it worked: `SELECT count(*) FROM vehicles;` should return **97**.

## 3. Create the Node.js app  (cPanel → Setup Node.js App → Create Application)

- **Node version:** 20 or 22
- **Application mode:** Production
- **Application root:** `amico` (a folder in your home directory)
- **Application URL:** your domain or subdomain (e.g. `amicomotors.co.za`)
- **Application startup file:** `server.cjs`

Save. cPanel creates the app and a Node virtual environment. Keep this screen open.

## 4. Upload the app

1. Extract **`amico-source.zip`** into the Application root (`~/amico`) — upload the
   zip in File Manager, then **Extract**.
2. Extract **`media.zip`** so the photos land in `~/amico/media/`. After extraction
   you should have `~/amico/media/` full of `.jpg` files.

## 5. Set environment variables  (on the Setup Node.js App screen)

⚠️ Set these **before** building — `NEXT_PUBLIC_SERVER_URL` is baked in at build time.

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PAYLOAD_SECRET` | a new long random string (see below) |
| `DATABASE_URI` | `postgresql://youruser_amico:PASSWORD@localhost:5432/youruser_amico` |
| `NEXT_PUBLIC_SERVER_URL` | `https://yourdomain.co.za` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | (optional) for lead emails |
| `EMAIL_FROM` / `LEADS_NOTIFY_TO` | (optional) from address / where leads are emailed |

Generate a secret locally: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 6. Install + build

Copy the "Enter to the virtual environment" command from the Node App screen (or use
Terminal), then:
```
npm install
npm run build
```
- `npm install` compiles the correct Linux image binaries (`sharp`).
- `npm run build` produces the production build.

If `npm run build` is **killed** (shared-hosting memory limit), see Troubleshooting.

## 7. Start

On the Setup Node.js App screen, click **Restart**. Then visit:
- Public site: `https://yourdomain`
- Admin: `https://yourdomain/admin` — log in as `admin@amicomotors.co.za` /
  `ChangeMe123!` and **change the password immediately**.

---

## Updating later

Re-upload changed source, run `npm install` (only if deps changed) + `npm run build`,
then Restart. **Do not delete** the `media/` folder or your env vars when updating.

## Troubleshooting

- **Build killed / out of memory:** shared hosting often caps RAM. Ask the host to
  raise the Node app's memory limit, or build locally (Linux/WSL) and upload the
  `.next` folder with the source — then just `npm install` on the server (no build).
- **502 / won't start:** check the app's stderr log (Node App screen → Logs, or
  `~/amico/stderr.log`). Usually a wrong `DATABASE_URI` or missing `PAYLOAD_SECRET`.
- **Images 404:** `media/` wasn't extracted into `~/amico/media/`. Re-extract `media.zip`.
- **Restore errors on an extension:** delete that line from `amico-db.sql` and re-run;
  Payload needs no Postgres extensions.

## Backups & notes

- Uploads save to `~/amico/media/` and persist. Back up the **Postgres database +
  the `media/` folder** together.
- For future schema changes, switch to Payload migrations
  (`npm run payload migrate:create` locally, commit, `payload migrate` on the server)
  instead of restoring a fresh dump.

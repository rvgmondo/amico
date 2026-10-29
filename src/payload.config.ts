import path from "path";
import { fileURLToPath } from "url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { en } from "@payloadcms/translations/languages/en";
import { seoPlugin } from "@payloadcms/plugin-seo";
import type { GenerateTitle } from "@payloadcms/plugin-seo/types";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Categories } from "./collections/Categories";
import { Enquiries } from "./collections/Enquiries";
import { Makes } from "./collections/Makes";
import { Media } from "./collections/Media";
import { Models } from "./collections/Models";
import { Pages } from "./collections/Pages";
import { Posts } from "./collections/Posts";
import { TeamMembers } from "./collections/TeamMembers";
import { Testimonials } from "./collections/Testimonials";
import { Users } from "./collections/Users";
import { Vehicles } from "./collections/Vehicles";
import { Navigation } from "./globals/Navigation";
import { SiteSettings } from "./globals/SiteSettings";
import { afrikaans, afSeoPlugin } from "./i18n/af";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

const generateTitle: GenerateTitle = ({ doc }) => {
  const title = (doc as { title?: string })?.title;
  return title ? `${title} | Amico Motors` : "Amico Motors";
};

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: " | Amico Motors",
      icons: [{ rel: "icon", type: "image/png", url: "/brand/mascot.png" }],
    },
    // Light, like the public site: white ground, navy ink, gold actions. See custom.scss.
    theme: "light",
    /*
     * The Amico Motors look, adapted from the Rynet and Verboten admins: the logo and mascot, a
     * menu with the day's work at the top, and a home screen that says which enquiries are
     * waiting and which cars still need something. Styling is src/app/(payload)/custom.scss.
     * After adding or moving any component path here, run `npm run generate:importmap`.
     */
    components: {
      graphics: {
        Logo: "/components/admin/brand/admin-logo#AdminLogo",
        Icon: "/components/admin/brand/admin-logo#AdminIcon",
      },
      Nav: "/components/admin/nav/admin-nav#AdminNav",
      beforeLogin: ["/components/admin/brand/admin-logo#LoginIntro"],
      views: {
        dashboard: { Component: "/components/admin/home#AdminHome" },
      },
    },
  },
  /*
   * Plainer words for a few Payload labels. Button names the dealership guide refers to
   * (Create New, Save, Status) are left as they are.
   */
  i18n: {
    // English and Afrikaans; each person switches with EN | AF in the admin menu. See src/i18n/af.ts.
    // Payload types only the languages it ships; Afrikaans is ours, so the map is widened here.
    supportedLanguages: { en, af: afrikaans } as unknown as { en: typeof en },
    fallbackLanguage: "en",
    translations: {
      en: {
        general: {
          dashboard: "Home",
          backToDashboard: "Back to home",
          creatingNewLabel: "Not saved yet",
          successfullyCreated: "{{label}} added.",
          updatedSuccessfully: "Saved.",
          deletedSuccessfully: "Deleted.",
          confirmDeletion: "Delete for good?",
          noResults: "Nothing to show. There are none yet, or none match the filters above.",
        },
        authentication: {
          login: "Sign in",
          logOut: "Sign out",
          logout: "Sign out",
          loggedOutSuccessfully: "You are signed out.",
        },
        error: {
          followingFieldsInvalid_one: "Fill in or fix this field first:",
          followingFieldsInvalid_other: "Fill in or fix these fields first:",
          correctInvalidFields: "Some fields need fixing before this can be saved.",
        },
      },
      // Payload types translations for its own languages only; the SEO plugin's Afrikaans goes here.
      af: afSeoPlugin,
    } as Record<string, object>,
  },
  collections: [
    Vehicles,
    Makes,
    Models,
    Enquiries,
    Posts,
    Categories,
    Testimonials,
    TeamMembers,
    Pages,
    Media,
    Users,
  ],
  globals: [SiteSettings, Navigation],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  serverURL,
  cors: [serverURL],
  csrf: [serverURL],
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  // SQLite by default (a single file, ideal for cPanel and self-hosting).
  // If DATABASE_URI is a postgres:// URL, use Postgres instead (e.g. Neon in prod).
  db: (process.env.DATABASE_URI || "").startsWith("postgres")
    ? postgresAdapter({ pool: { connectionString: process.env.DATABASE_URI || "" } })
    : sqliteAdapter({ client: { url: process.env.DATABASE_URI || "file:./amico.db" } }),
  // Only configure SMTP when provided; otherwise Payload logs emails to the console.
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress:
          process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] ||
          process.env.EMAIL_FROM?.trim() ||
          "noreply@amicomotors.co.za",
        defaultFromName: "Amico Motors",
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        },
      })
    : undefined,
  sharp,
  plugins: [
    seoPlugin({
      collections: ["vehicles", "posts", "pages"],
      uploadsCollection: "media",
      generateTitle,
      generateDescription: ({ doc }) =>
        (doc as { excerpt?: string })?.excerpt ?? "",
    }),
  ],
});

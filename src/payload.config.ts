import path from "path";
import { fileURLToPath } from "url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
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

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

const generateTitle: GenerateTitle = ({ doc }) => {
  const title = (doc as { title?: string })?.title;
  return title ? `${title} — Amico Motors` : "Amico Motors";
};

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: " — Amico Motors",
    },
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
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || "",
    },
  }),
  // Only configure SMTP when provided; otherwise Payload logs emails to the console.
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress:
          process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] || "noreply@amicomotors.co.za",
        defaultFromName: "Amico Motors",
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
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

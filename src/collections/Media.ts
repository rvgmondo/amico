import path from "path";

import type { CollectionConfig } from "payload";

import { anyone, isAdminOrEditor } from "../access/access";

/**
 * Uploaded media (vehicle photography, blog imagery, team photos).
 *
 * Files are written to the project-root `media/` directory in local dev. Alt
 * text is required for accessibility (WCAG 2.2 AA) and doubles as an SEO signal.
 * Named image sizes back the responsive cards, galleries and OG images so the
 * frontend never ships an oversized original.
 */
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: anyone,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  upload: {
    // Anchor to the app root (server.cjs chdir's here), so it resolves correctly
    // in the bundled production build, not relative to the compiled file location.
    staticDir: path.resolve(process.cwd(), "media"),
    mimeTypes: ["image/*"],
    focalPoint: true,
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "card", width: 768, height: 512, position: "centre" },
      { name: "feature", width: 1280, height: 853, position: "centre" },
      { name: "og", width: 1200, height: 630, position: "centre" },
    ],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      label: "Alt text",
      admin: {
        description: "Describe the image for screen readers and search engines.",
      },
    },
  ],
};

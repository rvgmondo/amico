import path from "path";
import { fileURLToPath } from "url";

import type { CollectionConfig } from "payload";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Uploaded media (vehicle photography, blog imagery, team photos).
 *
 * Files are written to the project-root `media/` directory in local dev.
 * Alt text is required for accessibility (WCAG 2.2 AA) and doubles as SEO signal.
 * Image sizes are expanded in Phase 2 once the gallery/card aspect ratios are set.
 */
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
  },
  upload: {
    staticDir: path.resolve(dirname, "../../media"),
    mimeTypes: ["image/*"],
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

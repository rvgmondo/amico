import type { CollectionConfig } from "payload";

import { anyone, isAdminOrEditor } from "../access/access";
import { slugField } from "../fields/slug";

/** Vehicle manufacturers (Ford, Toyota, VW, ...). Powers make filtering. */
export const Makes: CollectionConfig = {
  slug: "makes",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug"],
    group: "Inventory",
  },
  access: {
    read: anyone,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: "name", type: "text", required: true, unique: true },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      admin: { description: "Optional brand logo." },
    },
    slugField("name"),
  ],
};

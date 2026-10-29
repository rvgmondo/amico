import type { CollectionConfig } from "payload";

import { anyone, isAdminOrEditor } from "../access/access";
import { slugField } from "../fields/slug";
import { b } from "../i18n/labels";

/** Vehicle manufacturers (Ford, Toyota, VW, ...). Powers make filtering. */
export const Makes: CollectionConfig = {
  slug: "makes",
  labels: { singular: b("Make", "Handelsmerk"), plural: b("Makes", "Handelsmerke") },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug"],
    group: b("Inventory", "Voorraad"),
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

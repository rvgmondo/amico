import type { CollectionConfig } from "payload";

import { anyone, isAdminOrEditor } from "../access/access";
import { slugField } from "../fields/slug";

/** Vehicle models (Ranger, Corolla, Polo, ...), each linked to a make. */
export const Models: CollectionConfig = {
  slug: "models",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "make", "slug"],
    group: "Inventory",
  },
  access: {
    read: anyone,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "make",
      type: "relationship",
      relationTo: "makes",
      required: true,
    },
    slugField("name"),
  ],
};

import type { CollectionConfig } from "payload";

import { anyone, isAdminOrEditor } from "../access/access";
import { slugField } from "../fields/slug";

/** Blog/news categories. */
export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug"],
    group: "Blog",
  },
  access: {
    read: anyone,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [{ name: "title", type: "text", required: true }, slugField("title")],
};

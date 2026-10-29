import type { CollectionConfig } from "payload";

import { anyone, isAdminOrEditor } from "../access/access";
import { slugField } from "../fields/slug";
import { b } from "../i18n/labels";

/** Blog/news categories. */
export const Categories: CollectionConfig = {
  slug: "categories",
  labels: { singular: b("Category", "Kategorie"), plural: b("Categories", "Kategorieë") },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug"],
    group: b("Blog", "Blog"),
  },
  access: {
    read: anyone,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [{ name: "title", type: "text", required: true }, slugField("title")],
};

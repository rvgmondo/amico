import type { CollectionConfig } from "payload";

import { isAdminOrEditor, publishedOrEditor } from "../access/access";
import { slugField } from "../fields/slug";
import { b } from "../i18n/labels";

/** Blog / news articles (CMS-driven), with drafts and categories. */
export const Posts: CollectionConfig = {
  slug: "posts",
  labels: { singular: b("Post", "Nuusberig"), plural: b("Posts", "Nuus") },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "publishedDate", "_status"],
    group: b("Blog", "Blog"),
  },
  versions: {
    drafts: true,
  },
  access: {
    read: publishedOrEditor,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: "title", type: "text", required: true },
    slugField("title"),
    {
      name: "excerpt",
      type: "textarea",
      admin: { description: "Short summary for cards and meta descriptions." },
    },
    { name: "coverImage", type: "upload", relationTo: "media" },
    { name: "category", type: "relationship", relationTo: "categories" },
    { name: "author", type: "text", admin: { position: "sidebar" } },
    {
      name: "publishedDate",
      type: "date",
      admin: { position: "sidebar", date: { pickerAppearance: "dayOnly" } },
    },
    { name: "content", type: "richText" },
  ],
};

import type { CollectionConfig } from "payload";

import { isAdminOrEditor, publishedOrEditor } from "../access/access";
import { slugField } from "../fields/slug";
import { b } from "../i18n/labels";

/**
 * Editable marketing pages (About, Sell Your Car intro, Finance intro, legal).
 * Gives non-technical staff control of hero copy + body content per page. The
 * frontend routes look these up by slug.
 */
export const Pages: CollectionConfig = {
  slug: "pages",
  labels: { singular: b("Page", "Bladsy"), plural: b("Pages", "Bladsye") },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status"],
    group: b("Content", "Inhoud"),
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
      name: "hero",
      type: "group",
      fields: [
        { name: "heading", type: "text" },
        { name: "subheading", type: "textarea" },
        { name: "image", type: "upload", relationTo: "media" },
      ],
    },
    { name: "content", type: "richText" },
  ],
};

import type { CollectionConfig } from "payload";

import { anyone, isAdminOrEditor } from "../access/access";
import { b } from "../i18n/labels";

/** Customer reviews shown on the homepage and elsewhere. */
export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  labels: { singular: b("Testimonial", "Getuigskrif"), plural: b("Testimonials", "Getuigskrifte") },
  admin: {
    useAsTitle: "author",
    defaultColumns: ["author", "rating", "featured"],
    group: b("Content", "Inhoud"),
  },
  access: {
    read: anyone,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: "author", type: "text", required: true },
    { name: "quote", type: "textarea", required: true },
    { name: "location", type: "text" },
    {
      name: "rating",
      type: "number",
      min: 1,
      max: 5,
      defaultValue: 5,
      admin: { step: 1 },
    },
    { name: "date", type: "date" },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Prioritise on the homepage." },
    },
  ],
};

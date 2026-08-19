import type { CollectionConfig } from "payload";

import { anyone, isAdminOrEditor } from "../access/access";

/** Customer reviews shown on the homepage and elsewhere. */
export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  admin: {
    useAsTitle: "author",
    defaultColumns: ["author", "rating", "featured"],
    group: "Content",
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

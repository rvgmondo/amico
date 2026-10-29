import type { CollectionConfig } from "payload";

import { anyone, isAdminOrEditor } from "../access/access";
import { b } from "../i18n/labels";

/** Dealership team members shown on the About/Team section. */
export const TeamMembers: CollectionConfig = {
  slug: "team",
  labels: { singular: b("Team member", "Spanlid"), plural: b("Team", "Span") },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "role", "order"],
    group: b("Content", "Inhoud"),
  },
  access: {
    read: anyone,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "role", type: "text", admin: { description: "Job title, e.g. Sales Manager." } },
    { name: "photo", type: "upload", relationTo: "media" },
    { name: "bio", type: "textarea" },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      admin: { position: "sidebar", description: "Lower numbers appear first." },
    },
  ],
};

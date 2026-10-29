import type { GlobalConfig } from "payload";

import { anyone, isAdminOrEditor } from "../access/access";
import { b } from "../i18n/labels";

/** Header and footer navigation, editable without code. */
export const Navigation: GlobalConfig = {
  slug: "navigation",
  label: b("Navigation", "Kieslys op die webblad"),
  admin: { group: b("Settings", "Instellings") },
  access: {
    read: anyone,
    update: isAdminOrEditor,
  },
  fields: [
    {
      name: "header",
      type: "array",
      labels: { singular: "Header link", plural: "Header links" },
      fields: [
        { name: "label", type: "text", required: true },
        { name: "url", type: "text", required: true },
      ],
    },
    {
      name: "headerCta",
      type: "group",
      label: "Header call-to-action",
      fields: [
        { name: "label", type: "text" },
        { name: "url", type: "text" },
      ],
    },
    {
      name: "footerColumns",
      type: "array",
      labels: { singular: "Footer column", plural: "Footer columns" },
      fields: [
        { name: "heading", type: "text" },
        {
          name: "links",
          type: "array",
          fields: [
            { name: "label", type: "text", required: true },
            { name: "url", type: "text", required: true },
          ],
        },
      ],
    },
  ],
};

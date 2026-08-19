import type { GlobalConfig } from "payload";

import { anyone, isAdmin } from "../access/access";

/** Global site configuration editable by admins. */
export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  admin: { group: "Settings" },
  access: {
    read: anyone,
    update: isAdmin,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "General",
          fields: [
            { name: "dealershipName", type: "text", defaultValue: "Amico Motors" },
            { name: "legalName", type: "text", admin: { description: "e.g. SA Multi Franchise Group." } },
            { name: "tagline", type: "text" },
            {
              name: "hideSoldVehicles",
              type: "checkbox",
              defaultValue: false,
              admin: { description: "Hide sold vehicles from public listings." },
            },
          ],
        },
        {
          label: "Contact",
          fields: [
            {
              name: "contact",
              type: "group",
              fields: [
                { name: "street", type: "text" },
                { name: "suburb", type: "text" },
                { name: "city", type: "text" },
                { name: "postalCode", type: "text" },
                { name: "email", type: "email" },
                {
                  name: "phones",
                  type: "array",
                  fields: [
                    { name: "label", type: "text" },
                    { name: "number", type: "text" },
                  ],
                },
                {
                  name: "whatsappNumber",
                  type: "text",
                  admin: { description: "International format without +, e.g. 27823210455." },
                },
                { name: "whatsappMessage", type: "text" },
              ],
            },
            {
              name: "hours",
              type: "array",
              labels: { singular: "Day", plural: "Business hours" },
              fields: [
                { name: "day", type: "text" },
                { name: "open", type: "text" },
                { name: "close", type: "text" },
                { name: "closed", type: "checkbox" },
              ],
            },
            {
              name: "location",
              type: "group",
              fields: [
                { name: "mapEmbedUrl", type: "text" },
                { name: "latitude", type: "number" },
                { name: "longitude", type: "number" },
              ],
            },
          ],
        },
        {
          label: "Finance",
          fields: [
            {
              name: "finance",
              type: "group",
              fields: [
                {
                  name: "defaultRate",
                  type: "number",
                  admin: { description: "Annual interest rate %, e.g. 11.75. PLACEHOLDER until client confirms." },
                },
                { name: "defaultTermMonths", type: "number", defaultValue: 72 },
                { name: "defaultDepositPercent", type: "number", defaultValue: 10 },
                {
                  name: "disclaimer",
                  type: "textarea",
                  defaultValue:
                    "This is an estimate only and not a quote or an offer of finance. Actual terms depend on credit approval.",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

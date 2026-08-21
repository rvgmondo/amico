import type { CollectionConfig } from "payload";

import { isAdmin, isAdminOrEditor } from "../access/access";

/**
 * Captured leads: enquiries, test-drive bookings, finance applications,
 * trade-in valuations and contact messages.
 *
 * Security: public REST `create` is DISABLED, submissions come only through
 * the site's server actions (validated + rate-limited + honeypot), which use
 * the Local API with elevated access. This prevents open spam against the API.
 * Only admins/editors can read leads; only admins can create (in-admin) or delete.
 */
export const Enquiries: CollectionConfig = {
  slug: "enquiries",
  labels: { singular: "Enquiry", plural: "Enquiries" },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "type", "status", "vehicle", "createdAt"],
    group: "Leads",
  },
  access: {
    read: isAdminOrEditor,
    create: isAdmin,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "type",
          type: "select",
          required: true,
          defaultValue: "general",
          options: [
            { label: "General enquiry", value: "general" },
            { label: "Vehicle enquiry", value: "vehicle" },
            { label: "Test drive", value: "test-drive" },
            { label: "Finance", value: "finance" },
            { label: "Trade-in", value: "trade-in" },
            { label: "Contact", value: "contact" },
          ],
        },
        {
          name: "status",
          type: "select",
          required: true,
          defaultValue: "new",
          options: [
            { label: "New", value: "new" },
            { label: "Contacted", value: "contacted" },
            { label: "Closed", value: "closed" },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "email", type: "email" },
        { name: "phone", type: "text" },
      ],
    },
    {
      name: "vehicle",
      type: "relationship",
      relationTo: "vehicles",
      admin: { description: "The vehicle this lead is about, if any." },
    },
    { name: "preferredDate", type: "text", admin: { description: "For test-drive bookings." } },
    { name: "message", type: "textarea" },
    {
      name: "details",
      type: "json",
      admin: {
        readOnly: true,
        description: "Extra structured fields from trade-in / finance forms.",
      },
    },
    {
      name: "consent",
      type: "checkbox",
      label: "POPIA consent given",
      defaultValue: false,
    },
    {
      name: "source",
      type: "text",
      admin: { position: "sidebar", readOnly: true, description: "Submitting page URL." },
    },
  ],
};

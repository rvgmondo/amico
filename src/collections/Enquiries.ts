import type { CollectionConfig } from "payload";

import { isAdmin, isAdminOrEditor } from "../access/access";
import { b } from "../i18n/labels";

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
  labels: { singular: b("Enquiry", "Navraag"), plural: b("Enquiries", "Navrae") },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "type", "status", "vehicle", "createdAt"],
    group: b("Leads", "Navrae"),
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
          label: b("Type", "Soort"),
          required: true,
          defaultValue: "general",
          options: [
            { label: b("General enquiry", "Algemene navraag"), value: "general" },
            { label: b("Vehicle enquiry", "Vra oor 'n kar"), value: "vehicle" },
            { label: b("Test drive", "Toetsrit"), value: "test-drive" },
            { label: b("Finance", "Finansiering"), value: "finance" },
            { label: b("Trade-in", "Inruil"), value: "trade-in" },
            { label: b("Contact", "Kontakvorm"), value: "contact" },
          ],
        },
        {
          name: "status",
          type: "select",
          label: b("Status", "Status"),
          required: true,
          defaultValue: "new",
          options: [
            { label: b("New", "Nuut"), value: "new" },
            { label: b("Contacted", "Gekontak"), value: "contacted" },
            { label: b("Closed", "Afgehandel"), value: "closed" },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "name", type: "text", required: true, label: b("Name", "Naam") },
        { name: "email", type: "email", label: b("Email", "E-pos") },
        { name: "phone", type: "text", label: b("Phone", "Telefoon") },
      ],
    },
    {
      name: "vehicle",
      type: "relationship",
      label: b("Vehicle", "Kar"),
      relationTo: "vehicles",
      admin: { description: b("The car this enquiry is about, if any.", "Die kar waaroor die navraag gaan, as daar een is.") },
    },
    {
      name: "preferredDate",
      type: "text",
      label: b("Preferred date", "Voorkeurdatum"),
      admin: { description: b("For test-drive bookings.", "Vir toetsritte.") },
    },
    { name: "message", type: "textarea", label: b("Message", "Boodskap") },
    {
      name: "details",
      type: "json",
      label: b("Details", "Besonderhede"),
      admin: {
        readOnly: true,
        description: b("Extra answers from the trade-in and finance forms.", "Ekstra antwoorde van die inruil- en finansieringsvorms."),
      },
    },
    {
      name: "consent",
      type: "checkbox",
      label: b("POPIA consent given", "POPIA-toestemming gegee"),
      defaultValue: false,
    },
    {
      name: "source",
      type: "text",
      label: b("Sent from", "Gestuur vanaf"),
      admin: { position: "sidebar", readOnly: true, description: b("The page the form was sent from.", "Die bladsy waarvandaan die vorm gestuur is.") },
    },
  ],
};

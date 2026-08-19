import type { CollectionConfig } from "payload";

import { anyone, isAdminOrEditor } from "../access/access";
import { slugField } from "../fields/slug";
import {
  BODY_TYPES,
  CONDITIONS,
  DRIVETRAINS,
  FUEL_TYPES,
  TRANSMISSIONS,
  VEHICLE_STATUSES,
} from "../lib/vehicle-options";

/** The core inventory content type. */
export const Vehicles: CollectionConfig = {
  slug: "vehicles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "price", "year", "status", "featured"],
    listSearchableFields: ["title", "variant", "stockNumber"],
    group: "Inventory",
  },
  access: {
    read: anyone,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      admin: { description: 'Full title, e.g. "Ford Ranger 2.0D XLT Double Cab Auto 2021".' },
    },
    {
      type: "row",
      fields: [
        { name: "make", type: "relationship", relationTo: "makes", required: true },
        { name: "model", type: "relationship", relationTo: "models" },
        { name: "variant", type: "text", admin: { width: "50%" } },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "price",
          type: "number",
          required: true,
          min: 0,
          admin: { description: "Price in ZAR (Rand)." },
        },
        { name: "year", type: "number", required: true, min: 1950, max: 2100 },
        { name: "mileage", type: "number", min: 0, admin: { description: "Kilometres." } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "bodyType", type: "select", options: BODY_TYPES },
        { name: "fuelType", type: "select", options: FUEL_TYPES },
        { name: "transmission", type: "select", options: TRANSMISSIONS },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "drivetrain", type: "select", options: DRIVETRAINS },
        { name: "engine", type: "text", admin: { description: 'e.g. "2.0L turbo".' } },
        { name: "power", type: "text", admin: { description: 'e.g. "132 kW".' } },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "exteriorColour", type: "text" },
        { name: "interiorColour", type: "text" },
      ],
    },
    {
      name: "images",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      admin: { description: "Ordered gallery. The first image is the primary/cover photo." },
    },
    {
      name: "features",
      type: "array",
      labels: { singular: "Feature", plural: "Features" },
      fields: [{ name: "feature", type: "text", required: true }],
      admin: { description: "Key selling features (e.g. Leather seats, Sunroof, Reverse camera)." },
    },
    {
      name: "description",
      type: "richText",
    },
    // --- Sidebar ---
    {
      name: "condition",
      type: "select",
      options: CONDITIONS,
      defaultValue: "used",
      admin: { position: "sidebar" },
    },
    {
      name: "status",
      type: "select",
      options: VEHICLE_STATUSES,
      defaultValue: "available",
      required: true,
      admin: { position: "sidebar" },
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
      admin: { position: "sidebar", description: "Show on the homepage featured row." },
    },
    { name: "stockNumber", type: "text", admin: { position: "sidebar" } },
    { name: "vin", type: "text", label: "VIN", admin: { position: "sidebar" } },
    {
      name: "sourceUrl",
      type: "text",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Original listing URL (provenance for seeded data).",
      },
    },
    slugField("title"),
  ],
};

import type { CollectionConfig, Payload } from "payload";

import { anyone, isAdminOrEditor } from "../access/access";
import { slugField, slugify } from "../fields/slug";
import {
  BODY_TYPES,
  CONDITIONS,
  DRIVETRAINS,
  FUEL_TYPES,
  TRANSMISSIONS,
  VEHICLE_STATUSES,
} from "../lib/vehicle-options";

/**
 * Builds the listing title from the car itself ("2021 Ford Ranger XLT Double Cab Auto") when the
 * person adding it leaves the title blank, so nobody has to type the same words twice.
 */
type TitleArgs = { value?: unknown; data?: Record<string, unknown>; req: { payload: Payload } };

const titleFromCar = async ({ value, data, req }: TitleArgs) => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!data?.make) return value;

  const lookup = (collection: "makes" | "models", id: unknown) =>
    id
      ? req.payload
          .findByID({ collection, id: id as number, depth: 0 })
          .then((doc) => (doc as { name?: string }).name ?? null)
          .catch(() => null)
      : Promise.resolve(null);

  const [make, model] = await Promise.all([lookup("makes", data.make), lookup("models", data.model)]);
  return [data.year, make, model, data.variant]
    .filter((part) => part !== null && part !== undefined && String(part).trim() !== "")
    .join(" ");
};

/** The core inventory content type. */
export const Vehicles: CollectionConfig = {
  slug: "vehicles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "price", "year", "mileage", "status"],
    listSearchableFields: ["title", "variant", "stockNumber"],
    group: "Inventory",
    description: "Add a car in four tabs: Car, Photos, Specs, Story. Set its status in the right-hand panel.",
  },
  access: {
    read: anyone,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  // Runs before the field hooks, so the slug is built from the title it sets.
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (!data) return data;
        const title = await titleFromCar({ value: data.title, data, req });
        // Only ever sets a title, so an edit that does not send one keeps the saved title.
        if (typeof title === "string" && title) data.title = title;
        if (!data.slug && typeof data.title === "string" && data.title) data.slug = slugify(data.title);
        return data;
      },
    ],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Car",
          description: "The essentials. Only make, year and price are needed to save.",
          fields: [
            {
              name: "title",
              type: "text",
              // Required, but the collection hook above fills it in before validation runs.
              required: true,
              admin: {
                description: "Leave blank and it builds itself from year, make, model and variant.",
                placeholder: "Filled in for you when you save",
              },
            },
            {
              type: "row",
              fields: [
                { name: "make", type: "relationship", relationTo: "makes", required: true },
                {
                  name: "model",
                  type: "relationship",
                  relationTo: "models",
                  filterOptions: ({ data }) => (data?.make ? { make: { equals: data.make } } : true),
                  admin: { description: "Pick a make first to see its models." },
                },
                { name: "variant", type: "text", admin: { placeholder: "e.g. XLT Double Cab Auto" } },
              ],
            },
            {
              type: "row",
              fields: [
                { name: "year", type: "number", required: true, min: 1950, max: 2100 },
                {
                  name: "price",
                  type: "number",
                  required: true,
                  min: 0,
                  admin: {
                    description: "Price in rand (R), numbers only.",
                    components: { Cell: "/components/admin/cells/value-cells#RandCell" },
                  },
                },
                {
                  name: "mileage",
                  type: "number",
                  min: 0,
                  admin: {
                    description: "Kilometres, numbers only.",
                    components: { Cell: "/components/admin/cells/value-cells#KmCell" },
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Photos",
          description: "Drop in every photo at once. The first one is the cover; drag to reorder.",
          fields: [
            {
              name: "images",
              type: "upload",
              relationTo: "media",
              hasMany: true,
              label: false,
            },
          ],
        },
        {
          label: "Specs",
          fields: [
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
                { name: "exteriorColour", type: "text", label: "Exterior colour" },
                { name: "interiorColour", type: "text", label: "Interior colour" },
              ],
            },
          ],
        },
        {
          label: "Story",
          fields: [
            {
              name: "features",
              type: "array",
              labels: { singular: "Feature", plural: "Features" },
              admin: {
                description: "Key selling points, one per line (e.g. Leather seats, Sunroof, Reverse camera).",
                initCollapsed: false,
              },
              fields: [{ name: "feature", type: "text", required: true, label: "Feature" }],
            },
            {
              name: "description",
              type: "richText",
              admin: { description: "Optional. A few sentences on the car and its history." },
            },
          ],
        },
      ],
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
      admin: { position: "sidebar", components: { Cell: "/components/admin/cells/value-cells#StatusCell" } },
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
    // Last on purpose: the slug is built from the title, which the field above fills in first.
    slugField("title"),
  ],
};

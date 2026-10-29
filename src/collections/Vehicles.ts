import type { CollectionConfig, Payload } from "payload";

import { anyone, isAdminOrEditor } from "../access/access";
import { slugField, slugify } from "../fields/slug";
import { AF_OPTIONS, b, bilingual } from "../i18n/labels";
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
  labels: { singular: b("Vehicle", "Kar"), plural: b("Vehicles", "Karre") },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "price", "year", "mileage", "status"],
    listSearchableFields: ["title", "variant", "stockNumber"],
    group: b("Inventory", "Voorraad"),
    description: b(
      "Add a car in four tabs: Car, Photos, Specs, Story. Set its status in the right-hand panel.",
      "Laai 'n kar in vier oortjies: Kar, Foto's, Specs, Storie. Sy status staan in die paneel regs.",
    ),
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
          label: b("Car", "Kar"),
          description: b(
            "The essentials. Only make, year and price are needed to save.",
            "Die basiese goed. Net handelsmerk, jaar en prys is nodig om te stoor.",
          ),
          fields: [
            {
              name: "title",
              type: "text",
              label: b("Title", "Titel"),
              // Required, but the collection hook above fills it in before validation runs.
              required: true,
              admin: {
                description: b(
                  "Leave blank and it builds itself from year, make, model and variant.",
                  "Los oop, dan bou dit homself uit jaar, handelsmerk, model en variant.",
                ),
                placeholder: b("Filled in for you when you save", "Word vir jou ingevul as jy stoor"),
              },
            },
            {
              type: "row",
              fields: [
                { name: "make", type: "relationship", relationTo: "makes", required: true, label: b("Make", "Handelsmerk") },
                {
                  name: "model",
                  type: "relationship",
                  label: b("Model", "Model"),
                  relationTo: "models",
                  filterOptions: ({ data }) => (data?.make ? { make: { equals: data.make } } : true),
                  admin: { description: b("Pick a make first to see its models.", "Kies eers die handelsmerk om sy modelle te sien.") },
                },
                {
                  name: "variant",
                  type: "text",
                  label: b("Variant", "Variant"),
                  admin: { placeholder: b("e.g. XLT Double Cab Auto", "bv. XLT Double Cab Auto") },
                },
              ],
            },
            {
              type: "row",
              fields: [
                { name: "year", type: "number", required: true, min: 1950, max: 2100, label: b("Year", "Jaar") },
                {
                  name: "price",
                  type: "number",
                  label: b("Price", "Prys"),
                  required: true,
                  min: 0,
                  admin: {
                    description: b("Price in rand (R), numbers only.", "Prys in rand (R), net syfers."),
                    components: { Cell: "/components/admin/cells/value-cells#RandCell" },
                  },
                },
                {
                  name: "mileage",
                  type: "number",
                  label: b("Mileage", "Kilometers"),
                  min: 0,
                  admin: {
                    description: b(
                      "Kilometres, numbers only. Without it, Rynet does not show the car.",
                      "Net syfers. Sonder kilometers wys Rynet die kar nie.",
                    ),
                    components: { Cell: "/components/admin/cells/value-cells#KmCell" },
                  },
                },
              ],
            },
          ],
        },
        {
          label: b("Photos", "Foto's"),
          description: b(
            "Drop in every photo at once. The first one is the cover; drag to reorder.",
            "Sleep al die foto's gelyk in. Die eerste een is die voorblad; sleep om die volgorde te verander.",
          ),
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
          label: b("Specs", "Specs"),
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "bodyType",
                  type: "select",
                  label: b("Body type", "Bakstyl"),
                  options: bilingual(BODY_TYPES, AF_OPTIONS.bodyType),
                },
                {
                  name: "fuelType",
                  type: "select",
                  label: b("Fuel type", "Brandstof"),
                  options: bilingual(FUEL_TYPES, AF_OPTIONS.fuelType),
                },
                {
                  name: "transmission",
                  type: "select",
                  label: b("Transmission", "Ratkas"),
                  options: bilingual(TRANSMISSIONS, AF_OPTIONS.transmission),
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "drivetrain",
                  type: "select",
                  label: b("Drivetrain", "Aandrywing"),
                  options: bilingual(DRIVETRAINS, AF_OPTIONS.drivetrain),
                },
                {
                  name: "engine",
                  type: "text",
                  label: b("Engine", "Enjin"),
                  admin: { description: b('e.g. "2.0L turbo".', 'bv. "2.0L turbo".') },
                },
                {
                  name: "power",
                  type: "text",
                  label: b("Power", "Krag"),
                  admin: { description: b('e.g. "132 kW".', 'bv. "132 kW".') },
                },
              ],
            },
            {
              type: "row",
              fields: [
                { name: "exteriorColour", type: "text", label: b("Exterior colour", "Buitekleur") },
                { name: "interiorColour", type: "text", label: b("Interior colour", "Binnekleur") },
              ],
            },
          ],
        },
        {
          label: b("Story", "Storie"),
          fields: [
            {
              name: "features",
              type: "array",
              labels: { singular: b("Feature", "Kenmerk"), plural: b("Features", "Kenmerke") },
              admin: {
                description: b(
                  "Key selling points, one per line (e.g. Leather seats, Sunroof, Reverse camera).",
                  "Goeie punte, een per lyn (bv. Leersitplekke, Sondak, Trukamera).",
                ),
                initCollapsed: false,
              },
              fields: [{ name: "feature", type: "text", required: true, label: b("Feature", "Kenmerk") }],
            },
            {
              name: "description",
              type: "richText",
              label: b("Description", "Beskrywing"),
              admin: {
                description: b(
                  "Optional. A few sentences on the car and its history.",
                  "Opsioneel. 'n Paar sinne oor die kar en sy geskiedenis.",
                ),
              },
            },
          ],
        },
      ],
    },
    // --- Sidebar ---
    {
      name: "condition",
      type: "select",
      label: b("Condition", "Toestand"),
      options: bilingual(CONDITIONS, AF_OPTIONS.condition),
      defaultValue: "used",
      admin: { position: "sidebar" },
    },
    {
      name: "status",
      type: "select",
      label: b("Status", "Status"),
      options: bilingual(VEHICLE_STATUSES, AF_OPTIONS.status),
      defaultValue: "available",
      required: true,
      admin: { position: "sidebar", components: { Cell: "/components/admin/cells/value-cells#StatusCell" } },
    },
    {
      name: "featured",
      type: "checkbox",
      label: b("Featured", "Uitgelig"),
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: b("Show on the homepage featured row.", "Wys in die uitgeligte ry op die tuisblad."),
      },
    },
    { name: "stockNumber", type: "text", label: b("Stock number", "Voorraadnommer"), admin: { position: "sidebar" } },
    { name: "vin", type: "text", label: "VIN", admin: { position: "sidebar" } },
    {
      name: "sourceUrl",
      type: "text",
      label: b("Old website link", "Ou webblad se skakel"),
      admin: {
        position: "sidebar",
        readOnly: true,
        description: b("Where this car was listed on the old website.", "Waar hierdie kar op die ou webblad was."),
      },
    },
    // Last on purpose: the slug is built from the title, which the field above fills in first.
    slugField("title"),
  ],
};
